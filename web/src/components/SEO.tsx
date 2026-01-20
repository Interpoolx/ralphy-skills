/**
 * SEO Component using React 19 Native Hoisting
 * In React 19, <title>, <meta>, and <link> tags are automatically hoisted to the document head.
 */

interface SEOProps {
    title: string
    description?: string
    keywords?: string[]
    image?: string
    url?: string
    type?: 'website' | 'article'
}

export function SEO({
    title,
    description,
    keywords,
    image = 'https://ralphy-skills.pages.dev/og-image.png',
    url,
    type = 'website'
}: SEOProps) {
    const siteTitle = 'Ralphy Skills'
    const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`
    const currentUrl = url || typeof window !== 'undefined' ? window.location.href : ''

    return (
        <>
            {/* Standard metadata */}
            <title>{fullTitle}</title>
            {description && <meta name="description" content={description} />}
            {keywords && keywords.length > 0 && (
                <meta name="keywords" content={keywords.join(', ')} />
            )}

            {/* Facebook / Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={fullTitle} />
            {description && <meta property="og:description" content={description} />}
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={currentUrl} />
            <meta property="twitter:title" content={fullTitle} />
            {description && <meta property="twitter:description" content={description} />}
            <meta property="twitter:image" content={image} />
        </>
    )
}
