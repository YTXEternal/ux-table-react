import { spawnSync } from 'child_process';

const args = process.argv.slice(2);
const noCheck = args.includes('--no-check');

function runCommand(command: string, cmdArgs: string[]) {
  console.log(`\n> 执行: ${command} ${cmdArgs.join(' ')}`);
  
  // 使用 shell: true 以支持跨平台的命令执行（如在 Windows 上的 pnpm）
  const result = spawnSync(command, cmdArgs, { stdio: 'inherit', shell: true });
  
  if (result.error) {
    console.error(`\n❌ 命令执行出错: ${command} ${cmdArgs.join(' ')}`);
    console.error(result.error);
    process.exit(1);
  }
  
  if (result.status !== 0) {
    console.error(`\n❌ 命令失败，状态码 ${result.status}: ${command} ${cmdArgs.join(' ')}`);
    process.exit(result.status || 1);
  }
}

if (!noCheck) {
  console.log('开始执行提交前校验...');
  runCommand('pnpm', ['typecheck']);
  runCommand('pnpm', ['lint']);
  runCommand('pnpm', ['test']);
  runCommand('pnpm', ['test:e2e:run']);
  console.log('\n✅ 所有校验均已通过！');
} else {
  console.log('已跳过提交前校验 (--no-check)');
}

console.log('开始执行 git-cz...');
runCommand('pnpm', ['exec', 'git-cz']);
