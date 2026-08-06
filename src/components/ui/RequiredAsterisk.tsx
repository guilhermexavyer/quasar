"use client";

/**
 * Ícone de asterisco dos campos obrigatórios — mesmo glifo do Font Awesome
 * (fa-solid fa-asterisk, viewBox 0 0 384 512), renderizado como SVG inline
 * para dispensar a dependência dos estilos/pacote do Font Awesome.
 */
export default function RequiredAsterisk() {
  return (
    <svg
      width="8"
      height="10.5"
      viewBox="0 0 384 512"
      fill="currentColor"
      className="flex-shrink-0 text-red-600 required-asterisk"
      aria-hidden="true"
    >
      <path d="M192 32c17.7 0 32 14.3 32 32V199.5l111.5-66.9c15.2-9.1 34.8-4.2 43.9 11s4.2 34.8-11 43.9L254.2 256l114.3 68.6c15.2 9.1 20.1 28.7 11 43.9s-28.7 20.1-43.9 11L224 312.5V448c0 17.7-14.3 32-32 32s-32-14.3-32-32V312.5L48.5 379.4c-15.2 9.1-34.8 4.2-43.9-11s-4.2-34.8 11-43.9L129.8 256 15.5 187.4c-15.2-9.1-20.1-28.7-11-43.9s28.7-20.1 43.9-11L160 199.5V64c0-17.7 14.3-32 32-32z" />
    </svg>
  );
}
