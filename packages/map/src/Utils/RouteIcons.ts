// SVG图标的base64前缀
const base64Prefix = "data:image/svg+xml;charset=utf-8,";

export function getPointIcon(fillColor: string, outlineColor: string) {
  const icon = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12Z" fill="${outlineColor}"/>
            <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="${fillColor}"/>
        </svg>
      `;
  return `${base64Prefix}${encodeURIComponent(icon)}`;
}

export function getSafePointIcon(fillColor: string, outlineColor: string) {
  const icon = `
        <svg width="23" height="26" viewBox="0 0 23 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.44938 1.55457C9.48122 -0.518191 13.5188 -0.518191 16.5506 1.55457L22.5 5.62195V11.7348C22.5 15.915 20.274 19.7844 16.6457 21.911L11.5 26L6.35431 21.911C2.72601 19.7844 0.5 15.915 0.5 11.7348V5.62195L6.44938 1.55457Z" fill="${fillColor}"/>
            <path d="M6.44922 1.55458C9.48106 -0.518193 13.5189 -0.518193 16.5508 1.55458L22.5 5.62198V11.7343C22.5 15.9146 20.2738 19.7845 16.6455 21.9111L11.5 26L6.35449 21.9111C2.7262 19.7845 0.5 15.9146 0.5 11.7343V5.62198L6.44922 1.55458ZM15.4219 3.20595C13.1441 1.6487 10.1249 1.59954 7.80078 3.05947L2.5 6.67765V11.7343C2.5 15.0912 4.23157 18.2142 7.08594 20.0156L7.4873 20.2568L11.5 23.4453L15.4014 20.3447L15.6348 20.1855C18.6551 18.4151 20.5 15.1993 20.5 11.7343V6.67765L15.4219 3.20595Z" fill="${outlineColor}"/>
        </svg>
      `;
  return `${base64Prefix}${encodeURIComponent(icon)}`;
}

export function getFootPointIcon(fillColor: string, outlineColor: string) {
  const icon = `
        <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="1" width="14" height="14" rx="7" fill="${fillColor}"/>
            <rect x="1.5" y="1" width="14" height="14" rx="7" stroke="${outlineColor}" stroke-width="2"/>
        </svg>
      `;
  return `${base64Prefix}${encodeURIComponent(icon)}`;
}

export function getInsertionPointIcon(
  fillColor: string,
  outlineColor: string,
  textColor: string,
) {
  const icon = `
        <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.5 0.5C12.6421 0.5 16 3.85786 16 8C16 12.1421 12.6421 15.5 8.5 15.5C4.35786 15.5 1 12.1421 1 8C1 3.85786 4.35786 0.5 8.5 0.5Z" fill="${fillColor}"/>
            <path d="M8.5 0.5C12.6421 0.5 16 3.85786 16 8C16 12.1421 12.6421 15.5 8.5 15.5C4.35786 15.5 1 12.1421 1 8C1 3.85786 4.35786 0.5 8.5 0.5Z" stroke="${outlineColor}"/>
            <path d="M13.5 7.25H9.25V3H7.75V7.25H3.5V8.75H7.75V13H9.25V8.75H13.5V7.25Z" fill="${textColor}"/>
        </svg>
      `;
  return `${base64Prefix}${encodeURIComponent(icon)}`;
}

export function getFinishPointIcon(
  fillColor: string,
  outlineColor: string,
  textColor: string,
) {
  const icon = `
        <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="1" width="14" height="14" rx="7" fill="${fillColor}"/>
            <rect x="1.5" y="1" width="14" height="14" rx="7" stroke="${outlineColor}" stroke-width="2"/>
            <path d="M7.47044 9.58588L12.299 4.75732L13.1273 5.58565L7.47046 11.2425L3.87207 7.64412L4.68975 6.82644L7.47044 9.58588Z" fill="${textColor}"/>
        </svg>
      `;
  return `${base64Prefix}${encodeURIComponent(icon)}`;
}

export function getDeletePointIcon(
  fillColor: string,
  outlineColor: string,
  textColor: string,
) {
  const icon = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <foreignObject x="-8" y="-8" width="32" height="32"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(4px);clip-path:url(#bgblur_0_10343_48247_clip_path);height:100%;width:100%"></div></foreignObject><path data-figma-bg-blur-radius="8" d="M3 0.5H13C14.3807 0.5 15.5 1.61929 15.5 3V13C15.5 14.3807 14.3807 15.5 13 15.5H3C1.61929 15.5 0.5 14.3807 0.5 13V3C0.5 1.61929 1.61929 0.5 3 0.5Z" fill="${fillColor}" stroke="url(#paint0_linear_10343_48247)"/>
            <path d="M8.73657 8.00002L11.9038 4.83277L11.1672 4.0962L8 7.26345L4.83275 4.0962L4.09618 4.83277L7.26343 8.00002L4.09618 11.1673L4.83275 11.9038L8 8.73659L11.1672 11.9038L11.9038 11.1673L8.73657 8.00002Z" fill="${textColor}"/>
            <defs>
            <clipPath id="bgblur_0_10343_48247_clip_path" transform="translate(8 8)"><path d="M3 0.5H13C14.3807 0.5 15.5 1.61929 15.5 3V13C15.5 14.3807 14.3807 15.5 13 15.5H3C1.61929 15.5 0.5 14.3807 0.5 13V3C0.5 1.61929 1.61929 0.5 3 0.5Z"/>
            </clipPath><linearGradient id="paint0_linear_10343_48247" x1="0" y1="0" x2="16.3945" y2="15.585" gradientUnits="userSpaceOnUse">
            <stop stop-color="${outlineColor}"/>
            <stop offset="1" stop-color="${outlineColor}"/>
            </linearGradient>
            </defs>
        </svg>
      `;
  return `${base64Prefix}${encodeURIComponent(icon)}`;
}

export function getDeleteTurnPointIcon(
  fillColor: string,
  outlineColor: string,
  textColor: string,
) {
  const icon = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 0.5H13C14.3807 0.5 15.5 1.61929 15.5 3V13C15.5 14.3807 14.3807 15.5 13 15.5H3C1.61929 15.5 0.500001 14.3807 0.5 13V3C0.5 1.61929 1.61929 0.5 3 0.5Z" fill="${fillColor}"/>
            <path d="M3 0.5H13C14.3807 0.5 15.5 1.61929 15.5 3V13C15.5 14.3807 14.3807 15.5 13 15.5H3C1.61929 15.5 0.500001 14.3807 0.5 13V3C0.5 1.61929 1.61929 0.5 3 0.5Z" stroke="url(#paint0_linear_7362_7724)"/>
            <path d="M6.6875 10.625C6.58395 10.625 6.5 10.5411 6.5 10.4375V7.0625C6.5 6.95895 6.58395 6.875 6.6875 6.875H7.0625C7.16605 6.875 7.25 6.95895 7.25 7.0625V10.4375C7.25 10.5411 7.16605 10.625 7.0625 10.625H6.6875Z" fill="${textColor}"/>
            <path d="M8.9375 6.875C8.83395 6.875 8.75 6.95895 8.75 7.0625V10.4375C8.75 10.5411 8.83395 10.625 8.9375 10.625H9.3125C9.41605 10.625 9.5 10.5411 9.5 10.4375V7.0625C9.5 6.95895 9.41605 6.875 9.3125 6.875H8.9375Z" fill="${textColor}"/>
            <path d="M9.875 4.25H12.5V5H11.75L11.5625 12.5C11.5625 12.9142 11.2267 13.25 10.8125 13.25H5.1875C4.77329 13.25 4.4375 12.9142 4.4375 12.5L4.25 5H3.5V4.25H6.125L6.125 3.35C6.125 3.01863 6.39363 2.75 6.725 2.75H9.275C9.60637 2.75 9.875 3.01863 9.875 3.35V4.25ZM6.875 4.25H9.125L9.125 3.5L6.875 3.5V4.25ZM5 5L5.1875 12.5H10.8125L11 5H5Z" fill="${textColor}"/>
            <defs>
            <linearGradient id="paint0_linear_7362_7724" x1="0" y1="0" x2="16.3945" y2="15.585" gradientUnits="userSpaceOnUse">
            <stop stop-color="${outlineColor}"/>
            <stop offset="1" stop-color="${outlineColor}"/>
            </linearGradient>
            </defs>
        </svg>
      `;
  return `${base64Prefix}${encodeURIComponent(icon)}`;
}
