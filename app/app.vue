<script setup lang="ts">
import gsap from 'gsap';

useSeoMeta({
    title: "67 Clicker Simulator",
    description: "67 Clicker Simulator! Farm a lot of aura and climb the ranks!",
    ogTitle: "67 Clicker Simulator",
    ogDescription: "67 Clicker Simulator! Farm a lot of aura and climb the ranks!"
});

const auraPoints = ref<number>(0);
const clickCount = ref<number>(0);
// const lastClickTime = ref<number>(0);
const debuff = ref<boolean>(false);
const enabledTask = ref<number>(0);

const game_canvas = useTemplateRef('game-canvas');
const aura_textCounter = useTemplateRef('aura-textCounter');
const aura_task = useTemplateRef('aura-task');

const left_hand = useTemplateRef('left-hand');
const right_hand = useTemplateRef('right-hand');

const tasks: any = {
    0: 67,
    67: 67,
    100: 100,
    150: 150,
    200: 200,
    250: 250,
    300: 300,
    350: 350,
    400: 400,
    450: 450,
    500: 500,
    550: 550,
    600: 600,
    650: 650,
    700: 700,
    750: 750,
    800: 800,
    850: 850,
    900: 900,
    950: 950,
    1000: 1000
}

function shakeEffect(){
    // const now = performance.now();
    // const delta = now - lastClickTime.value;

    // // se o clique for rápido (menos de 350ms desde o último), aumenta a intensidade
    // clickCount.value = delta < 350 ? clickCount.value + 1 : 0;
    // lastClickTime.value = now;

    shakeMotionBlur(aura_textCounter.value);

    // sacudida sutil de fundo pra reforçar sensação de "tela toda tremeu"
    gsap.killTweensOf(game_canvas.value);
    gsap.fromTo(game_canvas.value,
        { x: 0 },
        {
            duration: 0.06,
            x: () => gsap.utils.random(-4, 4),
            repeat: 3,
            yoyo: true,
            ease: "power1.inOut",
            overwrite: "auto",
            onComplete: () => gsap.set(game_canvas.value, { x: 0 })
        }
    );
}

const verifyTask = (points: number) => {
    if(points >= tasks[enabledTask.value]){
        enabledTask.value = points;
        animateCSS(aura_task.value, 'tada');
    }
}

const canvaClickListener = (e) => {
    clickCount.value++

    if(debuff.value){
        if(clickCount.value % 4 === 0){
            auraPoints.value += 1;
        }
    }else auraPoints.value++;

    setUserLocalRecord(auraPoints.value);

    verifyTask(auraPoints.value);
    shakeEffect();

    explode(e.clientX + 5, e.clientY - 100);


    if(clickCount.value % 2){
        left_hand.value!.style.transform = 'translateY(-50px)';
        right_hand.value!.style.transform = 'translateY(50px)';
    }else{
        left_hand.value!.style.transform = 'translateY(50px)';
        right_hand.value!.style.transform = 'translateY(-50px)';
    }
};

const MODES = {
    fire: { chars: ['🔥', '🔥', '🔥']},
    text: { chars: ['A', 'U', 'R', 'A']}
};
let currentMode = 'fire';

  /* =========================================================
     OTIMIZAÇÃO PARA MUITOS CLIQUES
     -------------------------------------------------------
     1) Object pooling: elementos DOM de partícula são
        reciclados em vez de criados/destruídos a cada clique.
     2) Limite de partículas simultâneas (MAX_ACTIVE):
        se passar do teto, as explosões mais antigas são
        finalizadas (gsap.killTweensOf) para abrir espaço.
     3) Apenas transform/opacity são animados -> a GPU
        faz o trabalho pesado (compositor), sem reflow/repaint.
     4) DocumentFragment para inserir vários elementos de
        uma vez só, minimizando reflows.
     5) gsap.ticker/overwrite para não acumular tweens órfãos.
  ========================================================= */

const MAX_ACTIVE = 260;      // teto de partículas simultâneas na tela
const PARTICLES_PER_CLICK = 10;

let pool: Array<HTMLDivElement> = [];               // elementos <div> reaproveitáveis
let active: Array<{el: HTMLDivElement, x: number, y: number}> = [];             // partículas em animação agora

function getParticleEl() {
    let el = pool.pop();
    if(!el){
        el = document.createElement('div');
        el.className = 'particle';
        game_canvas.value!.appendChild(el);
    }
    return el;
}

function releaseParticleEl(el: HTMLDivElement) {
    el.style.opacity = '0';
    pool.push(el);
}

function trimIfOverBudget(need: number) {
    // se vamos estourar o teto, encerra as explosões mais antigas na hora
    while (active.length + need > MAX_ACTIVE && active.length) {
        const oldest = active.shift();
        gsap.killTweensOf(oldest.el);
        releaseParticleEl(oldest.el);
    }
}

const randRange = (min: number, max: number) =>  Math.random() * (max - min) + min;

function explode(x: number, y: number) {
    const mode = MODES[currentMode];
    const chars = mode.chars;
    const count = PARTICLES_PER_CLICK;

    trimIfOverBudget(count);

    // flash central rápido (efeito de "estopim")
    const flash = document.createElement('div');
    flash.className = 'flash';
    game_canvas.value!.appendChild(flash);
    gsap.set(flash, { x, y, scale: 0, opacity: 1 });
    gsap.to(flash, {
        scale: 3.2,
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: () => flash.remove()
    });

    const frag = [];

    for(let i = 0; i < count; i++){
        const el = getParticleEl();
        el.textContent = chars[Math.floor(Math.random() * chars.length)];

        const angle = (Math.PI * 2 * i) / count + randRange(-0.25, 0.25);
        const distance = randRange(90, 500);
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const rise = randRange(20, 70); // um pouco de "gravidade" pra cima antes de cair
        const scaleStart = randRange(0.5, 1.1);
        const rot = randRange(-180, 180);
        const dur = randRange(0.8, 1.4);

        gsap.killTweensOf(el);
        gsap.set(el, {
            x, y,
            scale: scaleStart,
            opacity: 1,
            rotation: 0
        });

        const item = { el, x, y };
        active.push(item);

        const tl = gsap.timeline({
            onComplete: () => {
                const idx = active.indexOf(item);
                if (idx > -1){
                    active.splice(idx, 1);
                };
                releaseParticleEl(el);
            },
        });

        tl.to(el, {
            x: x + dx,
            y: y + dy - rise,
            rotation: rot,
            duration: dur * 0.45,
            ease: 'power2.out'
        }, 0)
            .to(el, {
                y: `+=${Math.abs(rise) + randRange(40, 90)}`, // queda final
                opacity: 0,
                scale: scaleStart * 0.4,
                duration: dur * 0.55,
                ease: 'power1.in'
            }, dur * 0.45);

        frag.push(item);
    }
}

</script>

<template>
    <div class="w-full h-screen flex items-center bg-neutral-800 overflow-hidden">
        
        <p class="fixed top-2 left-2 font-bold text-neutral-500 text-2xl opacity-40">In-Development</p>

        <div ref="game-canvas" class="w-full h-screen sm:h-[80vh] flex flex-col justify-between items-center bg-neutral-500 border-y-2 border-neutral-900 overflow-hidden">

            <div class="w-full p-2 text-center">
                <!-- <button class="text-black bg-white px-5 py-0.5 cursor-pointer">Loja</button> -->
                <p ref="aura-textCounter" class="text-white font-bold text-xl font-mono select-none touch-action-none pointer-events-none transition-all">
                    Aura: <span>{{ auraPoints }}🔥</span>
                </p>

                <ClientOnly>
                    <p class="text-sm text-neutral-300">Record: {{ getUserLocalRecord() }}</p>
                </ClientOnly>
            </div>

            <div @click="canvaClickListener" class="w-full h-full flex justify-center">
                <div class="flex gap-x-2 min-[450px]:gap-x-5 sm:gap-x-10 lg:gap-x-24 items-end">
                    <img ref="left-hand" class="w-44 min-[450px]:w-52 sm:w-72 lg:w-80 object-cover select-none touch-action-none pointer-events-none transition-all" src="@/assets/images/left_hand.png" />
                    <img ref="right-hand" class="w-44 min-[450px]:w-52 sm:w-72 lg:w-80 object-cover select-none touch-action-none pointer-events-none transition-all" src="@/assets/images/right_hand.png" />
                </div>
            </div>

            <p ref="aura-task" class="text-white absolute font-mono font-bold top-42 text-2xl hidden"><span>{{ tasks[enabledTask] }}</span> FARMED AURAS!!!</p>
            
        </div>

    </div>
</template>

<style lang="css">

/* a própria partícula: leve, so transform/opacity sao animados (compositor-friendly) */
.particle {
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform, opacity;
    font-size: 26px;
    line-height: 1;
    pointer-events: none;
    user-select: none;
    transform: translate3d(-50%, -50%, 0);
    contain: layout style;
}

.flash {
    position: absolute;
    top: 0;
    left: 0;
    width: 16px;
    height: 16px;
    user-select: none;
    border-radius: 50%;
    background: radial-gradient(circle, #fff 0%, var(--accent) 40%, transparent 70%);
    pointer-events: none;
    will-change: transform, opacity;
    transform: translate3d(-50%, -50%, 0);
}
</style>