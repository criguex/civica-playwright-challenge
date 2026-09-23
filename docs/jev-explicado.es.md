# Jev, explicado para un niño de 5 años

## El robot que hablaba demasiado

Imaginate que tenés un amigo robot y le preguntás:

> — ¿El semáforo está en rojo?

El robot piensa un rato y te contesta:

> — Bueno, mirando hacia la esquina veo un poste alto con tres luces redondas,
> y me parece que la de arriba está encendida con un color cálido que
> probablemente sea rojo, aunque la luz del sol complica un poco...

Para saber si podés cruzar tuviste que escuchar **todo el discurso** y sacar la
conclusión vos. Y tardó.

Ese robot es un **LLM** (ChatGPT, Claude). Sirve para muchas cosas. Pero cuando
solo necesitás una respuesta, hablar tanto es un problema.

## El amigo que solo señala

Ahora imaginate otro amigo. Le preguntás lo mismo:

> — ¿El semáforo está en rojo?

Y él levanta el pulgar y dice una sola cosa:

> — **👍 0.97**

Eso significa: *"sí, y estoy 97% seguro"*.

No escribe. No cuenta cuentos. **Solo decide.** Y tarda lo que un parpadeo.

Ese es **Jev**.

---

## ¿Y esto qué tiene que ver con los tests?

### Antes: el robot que compara letritas

Nuestro test revisaba así:

> — ¿La pantalla dice **exactamente** «No results found»?

Un día el equipo de diseño cambió el texto a «No encontramos nada». La página
funcionaba perfecto. El usuario veía el mensaje correcto.

Pero el test **gritó que había un error**. Porque las letritas no eran iguales.

Es como si le enseñaras a un niño que "perro" es solo la palabra escrita así, y
al ver un perro de verdad dijera que no hay ningún perro.

### Ahora: el test que entiende

Ahora el test pregunta:

> — ¿La pantalla le está avisando al usuario que no encontró nada?

Y Jev responde **👍 0.96**.

Cambien el texto las veces que quieran, tradúzcanlo al portugués, pónganlo en
mayúsculas. Mientras el mensaje **signifique** lo mismo, el test pasa.

Solo falla cuando el significado se rompe — que es justo lo que queríamos saber.

---

## El otro truco: el ayudante que ordena el desorden

Imaginate que tenés 40 juguetes tirados y alguien te dice "algunos están rotos".

**Antes:** los revisabas uno por uno. Dos horas. Todas las mañanas.

**Ahora:** le pasás los 40 al amigo que señala, y él te los separa en montoncitos:

| Montón | Qué es | Cuántos |
|---|---|---|
| 🐛 **bug** | Roto de verdad | 4 |
| 🔌 **infra** | Se cayó el internet | 22 |
| ⏱️ **timing** | Miraste antes de tiempo | 9 |
| 🎯 **selector** | Cambiaron de lugar el botón | 5 |

Vos solo mirás los **4 de verdad**. Los otros 36 se reintentan solos.

De dos horas a cinco minutos.

---

## Lo honesto que hay que decir

Tres cosas que un niño de 5 años también entendería:

**1. El amigo no explica por qué.** Dice `0.97` y se queda callado. Por eso
nuestro código **siempre guarda** lo que le mostramos y todos los números que
devolvió. Si alguien pregunta "¿y por qué dijo que sí?", tenemos la evidencia.

**2. Si no hay llave, no opina.** Sin `TYPESAFE_API_KEY` el amigo no está. Y en
vez de inventar una respuesta, el test **anota que no pudo juzgar** y sigue.
Nunca fingimos un verde. Es la misma regla que ya usamos cuando IMDb nos
bloquea: preferimos decir "no pude" antes que mentir.

**3. Los que venden el amigo dicen que es buenísimo.** Puede que sí. Pero los
números los midieron ellos. Antes de confiarle una certificación, lo medimos
con nuestros propios datos.

---

## Cómo probarlo

```bash
npm run test:jev
```

Sin llave: corre, muestra el flujo y avisa que no juzgó nada.

Con llave: `export TYPESAFE_API_KEY=...` y ahora sí decide de verdad.

🎬 Vela moverse → [Diagrama interactivo del pipeline](jev-pipeline.html)
📄 Detalle técnico y decisiones → [ADR 0006](adr/0006-jev-semantic-oracle.md)
