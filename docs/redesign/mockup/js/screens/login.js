import { html, useState, cls } from '../lib.js';
import { useNav } from '../router.js';
import { Icon } from '../ui/icons.js';
import { Button } from '../ui/atoms.js';
import { PlanetSlot } from '../ui/planet-slot.js';

export function Login() {
  const nav = useNav();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (!user.trim() || !pass) {
      setError('Completá usuario y contraseña para entrar al archivo.');
      return;
    }
    setError('');
    setBusy(true);
    setTimeout(() => nav.go('home'), 700);
  };
  return html`<div class="login">
    <div class="login__planet"><${PlanetSlot} terra=${0.04} tilt=${0.1} bright=${0.95} label="Marte sin terraformar, visto desde la órbita" /></div>
    <div class="login__col">
      <div class="login__brand">
        <svg class="login__mark" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M20 2l15.6 9v18L20 38 4.4 29V11z" class="wm-hex"/>
          <path d="M8.5 25.5a14 14 0 0 1 23 0" class="wm-arc"/>
          <circle cx="20" cy="26" r="6.2" class="wm-planet"/>
          <circle cx="29.5" cy="13.5" r="1.6" class="wm-moon"/>
        </svg>
        <h1 class="login__title">Archivo de Terraformación</h1>
        <p class="login__sub">Partidas, ranking y récords del grupo de Terraforming Mars.</p>
      </div>
      <form class="login__form plate plate--glass" data-sheen onSubmit=${submit} noValidate>
        <h2 class="login__h">Acceso</h2>
        ${error && html`<p class="login__error" role="alert"><${Icon} name="info" size=${16} />${error}</p>`}
        <label class="field"><span class="field__label">Usuario</span>
          <input class=${cls('input', error && !user.trim() && 'is-bad')} id="login-user" autocomplete="username" value=${user}
            onInput=${(e) => setUser(e.target.value)} /></label>
        <label class="field"><span class="field__label">Contraseña</span>
          <span class="login__pass">
            <input class=${cls('input', error && !pass && 'is-bad')} id="login-pass" type=${show ? 'text' : 'password'} autocomplete="current-password"
              value=${pass} onInput=${(e) => setPass(e.target.value)} />
            <button type="button" class="login__eye" aria-pressed=${show} aria-label=${show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick=${() => setShow(!show)}><${Icon} name="eye" size=${18} /></button>
          </span></label>
        <${Button} type="submit" variant="primary" size="l" full disabled=${busy}>${busy ? 'Entrando…' : 'Ingresar'}</${Button}>
        <p class="login__help faint">La cuenta es compartida por el grupo. Si no la tenés, pedísela a quien administra la app.</p>
      </form>
      <p class="login__status"><span class="login__dot" aria-hidden="true"></span>Enlace con el archivo estable</p>
    </div>
  </div>`;
}
