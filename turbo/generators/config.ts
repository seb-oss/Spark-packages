import { PlopTypes } from '@turbo/gen'

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setPartial(
    'new-package-folder',
    '{{ turbo.paths.root }}/packages/{{name}}',
  )

  plop.setGenerator('package', {
    description: 'A new package in the monorepo',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the new package?',
        validate: (input: string) => {
          if (!input) {
            return 'file name is required'
          }

          return true
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'What is the description of the new package?',
      },
    ],
    actions: [
      {
        type: 'add',
        path: '{{> new-package-folder}}/package.json',
        templateFile: 'templates/package.json.hbs',
      },
      {
        type: 'add',
        path: '{{> new-package-folder}}/README.md',
        templateFile: 'templates/readme.md.hbs',
      },
      {
        type: 'add',
        path: '{{> new-package-folder}}/tsconfig.json',
        templateFile: 'templates/tsconfig.json.hbs',
      },
      {
        type: 'add',
        path: '{{> new-package-folder}}/src/index.ts',
        template: '',
      },
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/README.md',
        pattern: /(<!--NEW_PACKAGE-->)/gi,
        template:
          '### [@sebspark/{{name}}](./packages/{{name}})\n\n{{description}}\n\n$1',
      },
    ],
  })
}
