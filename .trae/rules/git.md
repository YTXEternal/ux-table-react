# git
- 提交时填入的文本信息必须是以中文为主

# 规范
基于gitflow规范
 - master主分支，不允许直接推送代码给master，需要通过其他分支合并
 - develop开发分支，用于开发新功能。
 - hotfix/*基于master创建，用于紧急修复bug，修复后需要合并到master和develop分支
 - feat/*基于develop创建，用于开发新功能，开发完成后需要合并到develop分支
 - release/*基于master创建，用于发布新版本，推送分支后需要合并到master、develop分支
 - chore/*基于develop创建，用于做一些杂物对功能没有影响的修改，修改完成后需要合并到develop分支
- 禁止直接推送代码到master分支（绝对遵循）