# DemonstracaoValida

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## GitHub Pages

O workflow [deploy-pages.yml](.github/workflows/deploy-pages.yml) publica a aplicação a cada push na branch `main` e também pode ser executado manualmente. Em cada repositório, selecione **Settings → Pages → Build and deployment → Source: GitHub Actions**.

- No repositório original `1real-sys/valida-demonstracao`, o build mantém o caminho base fornecido pelo Pages (`/valida-demonstracao/`).
- No repositório `demonstracaovalida/demonstracaovalida.github.io`, o build usa `/` para publicar em `https://demonstracaovalida.github.io/`.

Os dois repositórios executam o mesmo workflow de forma independente. Ambos publicam `dist/demonstracaoValida/browser`. Mantenha o repositório original como remote `origin` e o novo como remote `demonstracao`.

Para publicar sem expor o histórico do repositório original no novo repositório público, use a branch local `publicacao-demonstracao`, criada a partir de um commit inicial independente. Ao atualizar a demo, copie o estado atual de `main` para essa branch, crie um commit nela e envie `publicacao-demonstracao:main` somente ao remote `demonstracao`.

As rotas usam `#`, permitindo abrir relatórios em nova aba e recarregar qualquer tela em uma hospedagem estática. Para conferir localmente um build no caminho do repositório, execute:

```bash
npm run build -- --base-href /valida-demonstracao/
```

Para conferir localmente o build do novo endereço:

```bash
npm run build -- --base-href /
```

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
