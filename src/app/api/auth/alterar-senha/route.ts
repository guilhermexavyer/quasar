import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import type { Registro } from "@/lib/server/esquema";
import { perfisDoUsuario } from "@/lib/server/acesso";
import { corpo, rotaPublica } from "@/lib/server/http";
import { atualizar } from "@/lib/server/repositorio";
import { senhaConfere } from "@/lib/server/senha";
import { nomeParaAuditoria } from "@/lib/server/sessao";

/**
 * Troca de senha pedida no login ("Alterar senha no próximo login"). Só vale
 * para o usuário marcado (usuario.ie_alterar_senha = 'S'), e só com a senha
 * atual correta. Não abre sessão: depois de trocar, o usuário entra com a nova
 * senha pelo formulário de login. A troca é do próprio usuário, então a marca sai
 * (repositorio.atualizar) e a auditoria registra uma alteração de senha feita por ele.
 *
 * Resposta: { status } com ok | invalido | mesma_senha | nova_vazia.
 */
export async function POST(request: NextRequest) {
  return rotaPublica(request, async () => {
    const dados = await corpo(request);
    const usuarioDigitado = String(dados.usuario ?? "").trim().toLowerCase();
    // Mesma regra do login: a senha é usada sem os espaços das pontas.
    const senhaAtual = String(dados.senhaAtual ?? "").trim();
    const novaSenha = String(dados.novaSenha ?? "").trim();
    if (!usuarioDigitado || !senhaAtual) return NextResponse.json({ status: "invalido" }, { status: 401 });
    if (!novaSenha) return NextResponse.json({ status: "nova_vazia" }, { status: 400 });

    const { rows } = await query<Registro>(
      `select * from usuario
        where lower(btrim(coalesce(ds_usuario, ''))) = $1 or lower(btrim(coalesce(ds_usuario_alternativo, ''))) = $1
        order by nr_sequencia`,
      [usuarioDigitado]
    );
    const usuario = rows.find(
      (u) =>
        senhaConfere(senhaAtual, u.ds_senha as string | null) &&
        String(u.ie_alterar_senha ?? "").toUpperCase() === "S" &&
        !["B", "I"].includes(String(u.ie_status ?? "A").toUpperCase()) &&
        perfisDoUsuario(u).length > 0
    );
    if (!usuario) return NextResponse.json({ status: "invalido" }, { status: 401 });
    if (senhaConfere(novaSenha, usuario.ds_senha as string | null)) {
      return NextResponse.json({ status: "mesma_senha" }, { status: 400 });
    }

    const nr = Number(usuario.nr_sequencia);
    await atualizar("usuario", nr, { ds_senha: novaSenha }, { nrUsuario: nr, nomeUsuario: nomeParaAuditoria(usuario), usuario }, { trocaPropriaSenha: true });
    return NextResponse.json({ status: "ok" });
  });
}
