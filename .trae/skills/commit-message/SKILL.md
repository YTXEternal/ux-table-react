---
name: commit-message
description: 当你完成这个项目的代码更改时触发
---

# commit-message

## 使用场景
- 当你完成代码编写时会通过git查找本次的更改信息整理本次更改的结果

## 输出解释
以纯文本格式输出本次修改的type，scope，简短描述，详细描述

## 示例
type:{{type}}
scope:{{scope}}
shortDescription:{{desc}}
detail:{{detail}}