---
"@sebspark/tsconfig": major
---

### What
Switched all base configurations to split app and library targets:
- `/tsconfig.app.json` for apps  
- `/tsconfig.lib.json` for libraries  

### Why
To align with modern TypeScript defaults and simplify Node 22 + bundler builds.

### How to migrate
- **Apps:** extend `@sebspark/tsconfig/app.json` to use  
  `"moduleResolution": "NodeNext"`, `"module": "NodeNext"`.
- **Libraries:** extend `@sebspark/tsconfig/lib.json` to use  
  `"moduleResolution": "Bundler"`, `"module": "ESNext"`.
