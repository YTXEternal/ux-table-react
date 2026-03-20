---
alwaysApply: false
description: 当你完成代码编写后需要必须经过的校验
---
# 校验

在你把对应的测试代码编写完成后，需要进行校验，校验包括以下几个步骤：

- 执行pnpm typecheck 校验类型
- 执行pnpm lint 校验代码规范
- pnpm test单测
- pnpm test:e2e:run 端到端测试