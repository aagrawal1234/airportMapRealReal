'use client';

import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import LeafletMap component
const LeafletMap = dynamic(() => import('../components/LeafletMap'), { ssr: false });

export default function Page() {
    return (
        <>
            <Head>
                <title>Airport Map</title>
                <link
                    rel="stylesheet"
                    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                />
            </Head>
            <main style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <LeafletMap />
            </main>
        </>
    );
}