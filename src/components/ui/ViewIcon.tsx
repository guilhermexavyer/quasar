/**
 * Ícone de visualização: um documento/papel com linhas de texto — a
 * ficha/registro da pessoa. Todo desenhado com linhas retas e cantos de 90°
 * (incluindo o canto dobrado em diagonal reta), sem nenhum arco arredondado,
 * para um ar mais profissional. Traços retos (linecap butt / linejoin miter).
 */
export default function ViewIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d="M15 2H4v20h16V7Z" />
      <path d="M15 2v5h5" />
      <path d="M9 9H7" />
      <path d="M17 13H7" />
      <path d="M17 17H7" />
    </svg>
  );
}
