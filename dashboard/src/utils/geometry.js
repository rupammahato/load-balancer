export function polarToCartesian(cx, cy, radius, angleDegrees) {

    const radians = (angleDegrees - 90) * Math.PI / 180;

    return {

        x: cx + radius * Math.cos(radians),

        y: cy + radius * Math.sin(radians)

    };

}

export function generateBackendNodes(count, radius = 210) {

    const nodes = [];

    const angleStep = 360 / count;

    for (let i = 0; i < count; i++) {

        nodes.push({

            id: `backend-${i + 1}`,

            angle: i * angleStep,

            ...polarToCartesian(
                300,
                300,
                radius,
                i * angleStep
            )

        });

    }

    return nodes;

}