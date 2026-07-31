export async function copyImage(bytes, { setImageBinary } = {}) {
  const setter = setImageBinary ?? (await import('@mariozechner/clipboard')).setImageBinary;
  await setter(Array.from(bytes));
}
