# Instalando o JARVIS no Windows (passo a passo)

Tudo aqui é gratuito. Você usa a sua assinatura Claude Pro, sem chave de API.

## 1. Instalar o que falta (uma vez só)
1. **Node.js 20 ou mais novo (versão LTS):** https://nodejs.org (instalador padrão, "Next" até o fim).
2. Abra o **PowerShell** (ou o terminal do VS Code) e confira:
   ```powershell
   node --version
   git --version
   ```
3. Instale o **Claude Code** e faça login com a sua conta Claude Pro:
   ```powershell
   npm install -g @anthropic-ai/claude-code
   claude
   ```
   Siga o login no navegador, depois feche com `Ctrl+C` duas vezes.

## 2. Baixar o projeto
```powershell
git clone -b ptbr-memoria https://github.com/joaocmalexandre2012-jpg/JARVIS
cd JARVIS
npm install
npm run setup
```
O `npm run setup` confere tudo e diz em português simples o que falta.

## 3. Iniciar
```powershell
npm start
```
Abra **http://localhost:5173 no Chrome ou Edge** (janela normal, não o painel do VS Code,
que bloqueia o microfone). Clique em **INITIALISE**, permita o microfone e diga **"Hey Jarvis"**.

Teclas: **Espaço** fala sem a palavra de ativação · **Esc** para · **D** diagnóstico · **T** teste de áudio.

## 4. Onde ficam as coisas
- Memória, tarefas e notas: `C:\Users\<você>\.jarvis\workspace\jarvis-memory.json`
  (apague esse arquivo para ele esquecer tudo).
- Ele começa em **somente leitura**: pesquisa na internet e organiza memória/tarefas/notas,
  mas não envia, apaga nem instala nada.

## 5. Controle do computador (opcional, leia antes)
```powershell
npm start -- --writes
```
Libera terminal e edição de arquivos. O terminal alcança tudo que a sua conta do Windows alcança.
Use só quando precisar e desligue depois (`Ctrl+C`, e `npm start` normal).

## 6. Consumo do plano Pro
O padrão é `claude-sonnet-5-5` com esforço médio. Para mudar: variáveis `JARVIS_MODEL` e `JARVIS_EFFORT`.

## Problemas comuns
- **Ele não me ouve:** use Chrome/Edge em janela normal, permita o microfone, aperte **D**.
- **Voz em inglês ou robótica:** aperte **V** para trocar a voz. No Edge as vozes
  "Microsoft Antonio/Daniel Online (Natural)" em português soam melhor.
- **Porta ocupada:** feche outras instâncias do JARVIS.
