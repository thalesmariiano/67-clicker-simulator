import gsap from 'gsap';

export function shakeMotionBlur(target, intensity = 1) {
    // MATA qualquer tween em andamento nesse elemento antes de começar outro.
    // Isso é o que garante que cliques repetidos não acumulem/quebrem a animação.
    gsap.killTweensOf(target);
    gsap.killTweensOf(target, "filter");

    // reseta para um estado limpo instantaneamente (overwrite garante consistência)
    gsap.set(target, { x: 0, y: 0, rotation: 0, filter: "blur(0px)" });

    const tl = gsap.timeline({
        defaults: { overwrite: "auto" }
    });

    // amplitude cresce um pouco com cliques rápidos consecutivos, com limite
    const amp = 14 + Math.min(intensity, 6) * 2;
    // const blurAmt = 1 + Math.min(intensity, 1) * 1.5;

    // fase 1: impacto - blur alto, deslocamento forte, bem rápido (simula motion blur de alta velocidade)
    tl.to(target, {
        duration: 0.045,
        x: () => gsap.utils.random(-amp, amp),
        y: () => gsap.utils.random(-amp * 0.6, amp * 0.6),
        rotation: () => gsap.utils.random(-4, 4),
        // filter: `blur(${blurAmt}px)`,
        ease: "power1.inOut"
    });

    // fase 2: várias microssacudidas decrescentes, blur caindo junto
    const shakes = 6;
    for (let i = 0; i < shakes; i++) {
        const decay = 1 - i / shakes; // vai diminuindo
        tl.to(target, {
            duration: 0.045,
            x: () => gsap.utils.random(-amp, amp) * decay,
            y: () => gsap.utils.random(-amp * 0.6, amp * 0.6) * decay,
            rotation: () => gsap.utils.random(-4, 4) * decay,
            // filter: `blur(${blurAmt * decay}px)`,
            ease: "power1.inOut"
        });
    }

    // fase 3: assentamento - volta suave ao centro, blur zera
    tl.to(target, {
        duration: 0.35,
        x: 0,
        y: 0,
        rotation: 0,
        // filter: "blur(0px)",
        ease: "elastic.out(1, 0.4)"
    });

    // pequeno "punch" de escala pra reforçar o impacto inicial
    gsap.killTweensOf(target, "scale");
    gsap.fromTo(target,
        { scale: 0.94 },
        { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)", overwrite: "auto" }
    );

    return tl;
}

// function shakeEffect(){
//     const now = performance.now();
//     const delta = now - lastClickTime.value;

//     // se o clique for rápido (menos de 350ms desde o último), aumenta a intensidade
//     clickCount.value = delta < 350 ? clickCount.value + 1 : 0;
//     lastClickTime.value = now;


//     // sacudida sutil de fundo pra reforçar sensação de "tela toda tremeu"
//     gsap.killTweensOf(game_canvas.value);
//     gsap.fromTo(game_canvas.value,
//         { x: 0 },
//         {
//             duration: 0.06,
//             x: () => gsap.utils.random(-4, 4),
//             repeat: 3,
//             yoyo: true,
//             ease: "power1.inOut",
//             overwrite: "auto",
//             onComplete: () => gsap.set(game_canvas.value, { x: 0 })
//         }
//     );
// }