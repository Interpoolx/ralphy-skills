
import fetch from 'cross-fetch';

async function test() {
    console.log('Testing fetch...');
    try {
        const res = await fetch('https://ralphy-skills-api.rajeshkumarlawyer007.workers.dev/api/search?q=react');
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body length:', text.length);
        console.log('Body start:', text.substring(0, 100));
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

test();
