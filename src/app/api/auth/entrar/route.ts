import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { colunasDe, paraTela, type Registro } from "@/lib/server/esquema";
import { perfisDoUsuario } from "@/lib/server/acesso";
import { colunasDoUsuario } from "@/lib/server/colunasUsuario";
import { corpo, rotaPublica } from "@/lib/server/http";
import { senhaConfere } from "@/lib/server/senha";
import { criarSessao } from "@/lib/server/sessao";

/**
 * Login. A senha é conferida aqui, no servidor; o navegador nunca recebe a
 * lista de usuários nem o hash. Resposta: { status, usuario? } com status
 * ok | invalido | bloqueado | inativo | sem_perfil (as mesmas situações que a
 * tela de login já tratava).
 */
export async function POST(request: NextRequest) {
  return rotaPublica(request, async () => {
    const dados = await corpo(request);
    const usuarioDigitado = String(dados.usuario ?? "").trim().toLowerCase();
    const senha = String(dados.senha ?? "").trim();
    if (!usuarioDigitado || !senha) return NextResponse.json({ status: "invalido" }, { status: 401 });

    const { rows } = await query<Registro>(
      `select * from usuario
        where lower(btrim(coalesce(ds_usuario, ''))) = $1 or lower(btrim(coalesce(ds_usuario_alternativo, ''))) = $1
        order by nr_sequencia`,
      [usuarioDigitado]
    );
    const usuario = rows.find((u) => senhaConfere(senha, u.ds_senha as string | null));
    if (!usuario) return NextResponse.json({ status: "invalido" }, { status: 401 });

    const status = String(usuario.ie_status ?? "A").toUpperCase();
    if (status === "B") return NextResponse.json({ status: "bloqueado" }, { status: 403 });
    if (status === "I") return NextResponse.json({ status: "inativo" }, { status: 403 });
    if (perfisDoUsuario(usuario).length === 0) return NextResponse.json({ status: "sem_perfil" }, { status: 403 });

    await criarSessao(Number(usuario.nr_sequencia));
    const nr = Number(usuario.nr_sequencia);
    return NextResponse.json({
      status: "ok",
      usuario: { ...paraTela("usuario", await colunasDe("usuario"), usuario), ...(await colunasDoUsuario(nr)) },
    });
  });
}
