import { spawn } from 'node:child_process';

async function copyWithTool(command, bytes) {
  await new Promise((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), { stdio: ['pipe', 'inherit', 'inherit'] });
    child.on('error', error => reject(error));
    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command[0]} exited with code ${code}`));
    });
    child.stdin.on('error', () => {});
    child.stdin.end(bytes);
  });
}

function findTool() {
  if (process.env.WAYLAND_DISPLAY) return ['wl-copy', '--type', 'image/png'];
  if (process.env.DISPLAY) return ['xclip', '-selection', 'clipboard', '-t', 'image/png'];
  return null;
}

export async function copyImage(bytes, { setImageBinary, findTool: findToolOverride, copyWithTool: copyWithToolOverride } = {}) {
  const command = (findToolOverride ?? findTool)();
  if (command) {
    await (copyWithToolOverride ?? copyWithTool)(command, bytes);
    return;
  }
  const setter = setImageBinary ?? (await import('@mariozechner/clipboard')).setImageBinary;
  await setter(Array.from(bytes));
}
