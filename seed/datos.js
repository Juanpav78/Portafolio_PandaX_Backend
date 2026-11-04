// Contenido inicial de PandaX Code, copiado de pandax-code/src/data/fallback.js. Se copia (y no se
// importa) porque el backend y la web son repositorios distintos y se despliegan por separado.

export const servicios = [
    {
        slug: 'landing-pages',
        title: 'Landing Pages',
        description: 'Páginas enfocadas en convertir visitantes en clientes. Diseñadas para campañas, lanzamientos y generación de leads.',
        priceFrom: 600000,
        icon: 'layout',
        order: 1,
    },
    {
        slug: 'sitios-corporativos',
        title: 'Sitios Corporativos',
        description: 'Webs profesionales que transmiten confianza, representan tu marca y comunican tu propuesta de valor de forma efectiva.',
        priceFrom: 1200000,
        icon: 'monitor',
        order: 2,
    },
    {
        slug: 'e-commerce',
        title: 'E-commerce',
        description: 'Tiendas online seguras, rápidas y optimizadas para ofrecer la mejor experiencia de compra y aumentar tus ventas.',
        priceFrom: 1800000,
        icon: 'shopping-bag',
        order: 3,
    },
    {
        slug: 'rediseno-web',
        title: 'Rediseño Web',
        description: 'Transformamos tu sitio actual en una experiencia moderna, atractiva y optimizada para mejorar resultados.',
        priceFrom: 800000,
        icon: 'pen-tool',
        order: 4,
    },
    {
        slug: 'desarrollo-a-medida',
        title: 'Desarrollo a Medida',
        description: 'Soluciones web personalizadas con funcionalidades específicas para satisfacer las necesidades de tu negocio.',
        priceLabel: 'A la medida de tu proyecto',
        icon: 'code',
        order: 5,
    },
    {
        slug: 'mantenimiento-web',
        title: 'Mantenimiento Web',
        description: 'Cuidamos y optimizamos tu sitio para que siempre esté rápido, seguro y actualizado.',
        priceFrom: 150000,
        priceSuffix: '/mes',
        priceLabelPrefix: 'Planes desde',
        icon: 'rocket',
        order: 6,
    },
]

// Vibes ya está en el formato del modelo Proyecto (campos en español)
export const vibes = {
    slug: 'vibes',
    nombre: 'Vibes',
    tipo: 'E-commerce',
    subtitulo: 'Luxury Plant Lifestyle Store',
    resumen: 'Experiencia e-commerce enfocada en branding visual, navegación fluida y percepción premium para una marca lifestyle.',
    descripcion: 'Experiencia e-commerce enfocada en branding visual, navegación fluida y percepción premium para una marca lifestyle.',
    problema: 'Transmitir una identidad moderna y natural, enfocada en lifestyle premium y conexión con la naturaleza.',
    solucion: 'Diseño optimizado para generar mayor impacto visual, navegación intuitiva y una experiencia de compra agradable.',
    puntosClave: ['Responsive', 'Motion interactions', 'Premium UI', 'Fast performance', 'SEO optimizado'],
    tecnologias: 'Next.js, React, TypeScript, Tailwind CSS, Framer Motion',
    destacado: true,
    sitios: ['code', 'portafolio'],
}

export const testimonios = []
