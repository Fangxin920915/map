/**
 * 兼容二维xyz的url格式，将{*-*}转换为{s}模式
 * @param url
 */
export function getSubdomains(url: string) {
  const subdomains: Array<string> = [];
  const reg = /(?<={)\w-\w(?=})/;
  const matchArr = url.match(reg);
  if (matchArr && matchArr.length > 0) {
    const str: string = matchArr[0];
    const [start, end] = str.split("-");
    for (let i = start.charCodeAt(0); i <= end.charCodeAt(0); i++) {
      subdomains.push(String.fromCharCode(i));
    }
    return {
      url: url.replace(reg, "s"),
      subdomains,
    };
  }
  return {
    url,
    subdomains,
  };
}
