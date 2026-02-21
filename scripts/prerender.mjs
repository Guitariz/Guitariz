import fs from 'fs';
import path from 'path';

const TODAY = '2026-02-19';

const routes = [
  {
    url: '/',
    title: 'Guitariz - Chord AI Free, Stem Splitter AI & Music Studio Tools',
    description: 'The ultimate free music studio: Chord AI free, stem splitter ai, vocal remover, interactive fretboard, and more. Professional AI music tools with no subscription.',
    canonical: 'https://guitariz.studio/',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': 'https://guitariz.studio/#website',
          'url': 'https://guitariz.studio/',
          'name': 'Guitariz',
          'description': 'Professional music theory and AI analysis tools for musicians.',
          'inLanguage': 'en-US',
          'potentialAction': {
            '@type': 'SearchAction',
            'target': {
              '@type': 'EntryPoint',
              'urlTemplate': 'https://guitariz.studio/search?q={search_term_string}'
            },
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://guitariz.studio/#app',
          'name': 'Guitariz Studio',
          'url': 'https://guitariz.studio/',
          'description': 'Professional music theory and AI analysis tools for musicians.',
          'applicationCategory': 'MusicApplication',
          'operatingSystem': 'Web',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.9',
            'bestRating': '5',
            'worstRating': '1',
            'reviewCount': '128'
          }
        },
        {
          '@type': 'Organization',
          '@id': 'https://guitariz.studio/#org',
          'name': 'Guitariz Studio',
          'url': 'https://guitariz.studio/',
          'logo': 'https://guitariz.studio/logo2.png',
          'sameAs': [
            'https://x.com/GuitarizStudio',
            'https://github.com/abhi9vaidya/Guitariz'
          ]
        }
      ]
    })
  },
  {
    url: '/chord-ai',
    title: 'Chord AI Free - Audio to Chord Recognition AI | Guitariz',
    description: 'Extract chords, tempo, and scales from any song for free with Chord AI. Advanced AI chord recognition and harmonic transcription with no subscription.',
    canonical: 'https://guitariz.studio/chord-ai',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://guitariz.studio/chord-ai#app',
          'name': 'Chord AI - Guitariz',
          'url': 'https://guitariz.studio/chord-ai',
          'description': 'Advanced Chord AI: Extract chords, tempo, and scales from audio using neural networks.',
          'applicationCategory': 'MusicApplication',
          'operatingSystem': 'Web',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.8',
            'bestRating': '5',
            'worstRating': '1',
            'reviewCount': '84'
          }
        },
        {
          '@type': 'HowTo',
          'name': 'How to extract chords from any song using Guitariz Chord AI',
          'step': [
            { '@type': 'HowToStep', 'position': 1, 'text': 'Upload your audio file (MP3, WAV, FLAC) to the Chord AI engine.' },
            { '@type': 'HowToStep', 'position': 2, 'text': 'Enable Vocal Filter if the song has prominent vocals for better accuracy.' },
            { '@type': 'HowToStep', 'position': 3, 'text': 'Wait for the AI to analyze the harmonic structure and generate the chord map.' },
            { '@type': 'HowToStep', 'position': 4, 'text': 'Use the interactive player to play along with the extracted chords in real-time.' }
          ]
        }
      ]
    })
  },
  {
    url: '/vocal-splitter',
    title: 'AI Vocal Splitter & Stem Splitter AI - Free Vocal Remover | Guitariz',
    description: 'Separate vocals and instrumentals from any song using Stem Splitter AI. High-quality vocal remover and stem extraction for karaoke and practice.',
    canonical: 'https://guitariz.studio/vocal-splitter',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://guitariz.studio/vocal-splitter#app',
          'name': 'Guitariz Vocal Splitter',
          'applicationCategory': 'MultimediaApplication',
          'operatingSystem': 'Web',
          'description': 'High-quality AI stem extraction for karaoke and remixing.',
          'url': 'https://guitariz.studio/vocal-splitter',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.9',
            'bestRating': '5',
            'worstRating': '1',
            'reviewCount': '56'
          }
        },
        {
          '@type': 'HowTo',
          'name': 'How to separate vocals using Guitariz Vocal Splitter',
          'step': [
            { '@type': 'HowToStep', 'position': 1, 'text': 'Upload your audio file.' },
            { '@type': 'HowToStep', 'position': 2, 'text': 'Click Separate Vocals.' },
            { '@type': 'HowToStep', 'position': 3, 'text': 'Preview the isolated stems.' },
            { '@type': 'HowToStep', 'position': 4, 'text': 'Download your tracks.' }
          ]
        }
      ]
    })
  },
  {
    url: '/stem-separator',
    title: 'Stem Splitter AI - Extract Vocals, Drums, Bass, Guitar, Piano | Guitariz',
    description: 'Separate any song into 6 stems with Stem Splitter AI: vocals, drums, bass, guitar, piano, and other. High-quality AI stem extraction for music production.',
    canonical: 'https://guitariz.studio/stem-separator',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://guitariz.studio/stem-separator#app',
          'name': 'Guitariz Stem Separator',
          'applicationCategory': 'MultimediaApplication',
          'operatingSystem': 'Web',
          'description': 'Separate songs into 6 stems: vocals, drums, bass, guitar, piano, and other.',
          'url': 'https://guitariz.studio/stem-separator',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.8',
            'bestRating': '5',
            'worstRating': '1',
            'reviewCount': '72'
          }
        },
        {
          '@type': 'HowTo',
          'name': 'How to separate a song into 6 stems using Guitariz Stem Separator',
          'step': [
            { '@type': 'HowToStep', 'position': 1, 'text': 'Upload your audio file (MP3, WAV, FLAC, M4A) to the Stem Separator.' },
            { '@type': 'HowToStep', 'position': 2, 'text': 'Click "Separate Into 6 Stems" to start AI-powered separation.' },
            { '@type': 'HowToStep', 'position': 3, 'text': 'Wait 5-10 minutes for the neural network to process all stems.' },
            { '@type': 'HowToStep', 'position': 4, 'text': 'Preview and independently control the volume of each stem.' },
            { '@type': 'HowToStep', 'position': 5, 'text': 'Download any or all stems as high-quality audio files.' }
          ]
        }
      ]
    })
  },
  {
    url: '/fretboard',
    title: 'Interactive Guitar Fretboard & Scale Explorer | Guitariz',
    description: 'Master guitar theory with our interactive fretboard. Visualize scales, chords, and notes across the neck. Perfect for guitarists of all levels.',
    canonical: 'https://guitariz.studio/fretboard',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://guitariz.studio/fretboard#app',
          'name': 'Guitariz Virtual Fretboard',
          'applicationCategory': 'MusicApplication',
          'operatingSystem': 'Web',
          'description': 'Interactive instrument sandbox for guitar and piano.',
          'url': 'https://guitariz.studio/fretboard',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.9',
            'bestRating': '5',
            'worstRating': '1',
            'reviewCount': '215'
          }
        },
        {
          '@type': 'HowTo',
          'name': 'How to visualize scales and chords on the Guitariz Fretboard',
          'step': [
            { '@type': 'HowToStep', 'position': 1, 'text': 'Open the Interactive Fretboard tool.' },
            { '@type': 'HowToStep', 'position': 2, 'text': 'Select a root note and scale or chord from the controls.' },
            { '@type': 'HowToStep', 'position': 3, 'text': 'The fretboard highlights all positions across the neck.' },
            { '@type': 'HowToStep', 'position': 4, 'text': 'Click any note on the fretboard to hear it played.' }
          ]
        }
      ]
    })
  },
  {
    url: '/chords',
    title: 'Guitar Chord Library - 1000+ Diagrams & Voicings | Guitariz',
    description: 'Explore a comprehensive guitar chord library. Detailed diagrams, finger positions, and interactive voicings for every chord and every level.',
    canonical: 'https://guitariz.studio/chords',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://guitariz.studio/chords#app',
          'name': 'Guitariz Chord Library',
          'applicationCategory': 'MusicApplication',
          'operatingSystem': 'Web',
          'description': 'Comprehensive guitar chord library with interactive diagrams.',
          'url': 'https://guitariz.studio/chords',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.9',
            'bestRating': '5',
            'worstRating': '1',
            'reviewCount': '128'
          }
        },
        {
          '@type': 'HowTo',
          'name': 'How to find and learn guitar chords using the Guitariz Chord Library',
          'step': [
            { '@type': 'HowToStep', 'position': 1, 'text': 'Browse or search for a chord by root note (e.g. C, G, Am).' },
            { '@type': 'HowToStep', 'position': 2, 'text': 'Select a chord type (major, minor, 7th, sus4, etc.).' },
            { '@type': 'HowToStep', 'position': 3, 'text': 'View the interactive fretboard diagram with finger positions.' },
            { '@type': 'HowToStep', 'position': 4, 'text': 'Click the diagram to hear the chord played.' }
          ]
        }
      ]
    })
  },
  {
    url: '/scales',
    title: 'Guitar Scale Explorer - Interactive Scale Patterns & Modes | Guitariz',
    description: 'Explore guitar scales and modes visually. Interactive patterns for major, minor, pentatonic, and exotic scales.',
    canonical: 'https://guitariz.studio/scales',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': 'https://guitariz.studio/scales#app',
      'name': 'Guitariz Scale Explorer',
      'applicationCategory': 'MusicApplication',
      'operatingSystem': 'Web',
      'description': 'Interactive guitar scale explorer for learning scale patterns.',
      'url': 'https://guitariz.studio/scales',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'bestRating': '5',
        'worstRating': '1',
        'reviewCount': '192'
      }
    })
  },
  {
    url: '/theory',
    title: 'Interactive Circle of Fifths - Music Theory Lab | Guitariz',
    description: 'Master functional harmony with our interactive Circle of Fifths. Visualize key relationships, modulations, and chord families.',
    canonical: 'https://guitariz.studio/theory',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': 'https://guitariz.studio/theory#app',
      'name': 'Guitariz Theory Lab',
      'applicationCategory': 'MusicApplication',
      'operatingSystem': 'Web',
      'description': 'Interactive music theory tools featuring the Circle of Fifths.',
      'url': 'https://guitariz.studio/theory',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'bestRating': '5',
        'worstRating': '1',
        'reviewCount': '156'
      }
    })
  },
  {
    url: '/jam',
    title: 'Jam Studio - Loop Chord Progressions with AI Piano & Pads | Guitariz',
    description: 'Create and loop chord progressions with our free Jam Studio. Play along with AI-generated piano, pads, and metronome for the ultimate practice session.',
    canonical: 'https://guitariz.studio/jam',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://guitariz.studio/jam#app',
          'name': 'Guitariz Jam Studio',
          'applicationCategory': 'MusicApplication',
          'operatingSystem': 'Web',
          'description': 'Loop chord progressions with piano and pad backing for practice and composition.',
          'url': 'https://guitariz.studio/jam',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.8',
            'bestRating': '5',
            'worstRating': '1',
            'reviewCount': '43'
          }
        },
        {
          '@type': 'HowTo',
          'name': 'How to jam with chord progressions using Guitariz Jam Studio',
          'step': [
            { '@type': 'HowToStep', 'position': 1, 'text': 'Select a key, scale, and tempo for your jam session.' },
            { '@type': 'HowToStep', 'position': 2, 'text': 'Build a chord progression by clicking chords from the palette.' },
            { '@type': 'HowToStep', 'position': 3, 'text': 'Enable piano or pad accompaniment to play along.' },
            { '@type': 'HowToStep', 'position': 4, 'text': 'Press Play to loop the progression and jam in real-time.' }
          ]
        }
      ]
    })
  },
  {
    url: '/metronome',
    title: 'Online Metronome & High-Precision Timing | Guitariz',
    description: 'Free online metronome for precise timing. Adjustable tempo, time signatures, and visual pulse for musicians.',
    canonical: 'https://guitariz.studio/metronome',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': 'https://guitariz.studio/metronome#app',
      'name': 'Guitariz Online Metronome',
      'applicationCategory': 'MusicApplication',
      'operatingSystem': 'Web',
      'description': 'Free online metronome with adjustable tempo and time signatures.',
      'url': 'https://guitariz.studio/metronome',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
    })
  },
  {
    url: '/tuner',
    title: 'Online Guitar Tuner - Chromatic Tuning Precision | Guitariz',
    description: 'Free online chromatic tuner for guitar, bass, and other instruments. High-precision pitch detection.',
    canonical: 'https://guitariz.studio/tuner',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': 'https://guitariz.studio/tuner#app',
      'name': 'Guitariz Online Tuner',
      'applicationCategory': 'MusicApplication',
      'operatingSystem': 'Web',
      'description': 'Professional online chromatic tuner with high-precision detection.',
      'url': 'https://guitariz.studio/tuner',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
    })
  },
  {
    url: '/ear-training',
    title: 'Ear Training - Level Up Your Musical Hearing | Guitariz',
    description: 'Gamified ear training for intervals, chords, and pitch recognition. Improve your musicality with our interactive tools.',
    canonical: 'https://guitariz.studio/ear-training',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': 'https://guitariz.studio/ear-training#app',
      'name': 'Guitariz Ear Training',
      'applicationCategory': 'MusicApplication',
      'operatingSystem': 'Web',
      'description': 'Interactive ear training tools for musicians.',
      'url': 'https://guitariz.studio/ear-training',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
    })
  }
];

const distDir = path.resolve(process.cwd(), 'dist');
const srcIndexPath = path.resolve(distDir, 'index.html');

if (!fs.existsSync(srcIndexPath)) {
  console.error('dist/index.html not found. Run `vite build` first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(srcIndexPath, 'utf8');

for (const r of routes) {
  const outDir = path.join(distDir, r.url.replace(/^\//, ''));
  const outIndex = r.url === '/' ? path.join(distDir, 'index.html') : path.join(outDir, 'index.html');

  let html = baseHtml;

  // Replace title
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${r.title}</title>`);

  // Inject/replace meta description
  if (/meta name="description"/i.test(html)) {
    html = html.replace(/<meta name="description"[\s\S]*?>/i, `<meta name="description" content="${r.description}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="description" content="${r.description}" />\n</head>`);
  }

  // Replace canonical link
  if (/rel="canonical"/i.test(html)) {
    html = html.replace(/<link rel="canonical"[\s\S]*?>/i, `<link rel="canonical" href="${r.canonical}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${r.canonical}" />\n</head>`);
  }

  // Replace og:url, og:title, og:description, og:type
  if (/property="og:url"/i.test(html)) {
    html = html.replace(/<meta property="og:url"[\s\S]*?>/i, `<meta property="og:url" content="${r.canonical}" />`);
  }
  if (/property="og:title"/i.test(html)) {
    html = html.replace(/<meta property="og:title"[\s\S]*?>/i, `<meta property="og:title" content="${r.title}" />`);
  }
  if (/property="og:description"/i.test(html)) {
    html = html.replace(/<meta property="og:description"[\s\S]*?>/i, `<meta property="og:description" content="${r.description}" />`);
  }
  if (/property="og:type"/i.test(html)) {
    html = html.replace(/<meta property="og:type"[\s\S]*?>/i, `<meta property="og:type" content="website" />`);
  } else {
    html = html.replace('</head>', `  <meta property="og:type" content="website" />\n</head>`);
  }

  // Ensure og:image uses logo2.png
  if (/property="og:image"/i.test(html)) {
    html = html.replace(/<meta property="og:image"[\s\S]*?>/i, `<meta property="og:image" content="https://guitariz.studio/logo2.png" />`);
  } else {
    html = html.replace('</head>', `  <meta property="og:image" content="https://guitariz.studio/logo2.png" />\n</head>`);
  }

  // Ensure twitter image
  if (/name="twitter:image"/i.test(html)) {
    html = html.replace(/<meta name="twitter:image"[\s\S]*?>/i, `<meta name="twitter:image" content="https://guitariz.studio/logo2.png" />`);
  } else {
    html = html.replace('</head>', `  <meta name="twitter:image" content="https://guitariz.studio/logo2.png" />\n</head>`);
  }

  // Insert page-specific JSON-LD before </head>
  const ldScript = `  <script type="application/ld+json">${r.jsonLd}</script>`;
  html = html.replace('</head>', `${ldScript}\n</head>`);

  // Write out
  if (r.url !== '/') {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outIndex, html, 'utf8');
  console.log(`Wrote prerendered page: ${outIndex}`);
}

console.log(`\nPrerender completed for ${routes.length} routes: ${routes.map(r => r.url).join(', ')}`);
console.log(`lastmod date used: ${TODAY}`);
