# Usando o JARVIS pelo iPhone

O servidor do JARVIS continua escutando **só no próprio PC** (127.0.0.1). O celular entra por
uma rede privada gratuita do **Tailscale**, que só aceita os seus aparelhos. Nunca use o
"Tailscale Funnel": ele publica na internet aberta.

## 1. Uma vez só
1. Crie uma conta gratuita em https://tailscale.com e instale o Tailscale **no PC e no iPhone**,
   entrando com a mesma conta.
2. No Tailscale (painel web, aba DNS), ative **MagicDNS** e **HTTPS Certificates**.
3. No PC, descubra o nome do aparelho (algo como `meupc.tail1234.ts.net`):
   ```powershell
   tailscale status
   ```

## 2. Toda vez que quiser usar
No PC, em dois terminais:
```powershell
tailscale serve --bg 5173
$env:JARVIS_PHONE_HOST = "meupc.tail1234.ts.net"   # troque pelo seu nome
npm start
```
No iPhone, com o Tailscale ligado, abra no **Safari**: `https://meupc.tail1234.ts.net`

## Limites (seja realista)
- Não foi testado em um iPhone real. Verifiquei só o caminho de rede (proxy e bloqueios).
- O Safari do iPhone tem reconhecimento de voz limitado e pode falhar. A fala do JARVIS
  e o uso por texto/painéis devem funcionar; o microfone é o ponto frágil.
- O PC precisa estar ligado, com o JARVIS rodando.
- Com `--writes`, quem estiver na sua rede Tailscale (só você) poderia comandar o PC.
  Para o celular, prefira o modo somente leitura.
- Para desligar o acesso: `tailscale serve reset`.
