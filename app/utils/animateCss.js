
export const animateCSS = (element, animation, prefix = 'animate__') =>
    // We create a Promise and return it
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;

        element.classList.remove('hidden');
        element.classList.add(`${prefix}animated`, animationName);

        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd(event) {
            event.stopPropagation();
            element.classList.add('hidden');
            element.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }

        element.addEventListener('animationend', handleAnimationEnd, { once: true });
    }
);