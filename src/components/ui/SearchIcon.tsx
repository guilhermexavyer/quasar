/**
 * Ícone de busca/localização: uma lupa com lente circular e cabo reto em
 * diagonal (com ponta reta, sem arredondamento). O cabo mantém o traço
 * angular, enquanto a lente é um círculo clássico.
 */
export default function SearchIcon({ size = 18 }: { size?: number }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="M16 16L21 21" />
    </svg>
  );
}
