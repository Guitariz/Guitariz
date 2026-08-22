import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const TODAY = new Date().toISOString().split('T')[0];

// Load static content JSON
const staticContent = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'src/data/staticContent.json'), 'utf8')
);

const routes = [
  {
    url: '/',
    title: staticContent.home.title,
    description: staticContent.home.description,
    canonical: 'https://guitariz.studio/',
    customHtml: `<div style="margin-top: 32px; line-height: 1.8; color: #d4d4d8;">${staticContent.home.html}</div>`,
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': 'https://guitariz.studio/#website',
          'url': 'https://guitariz.studio/',
          'name': 'Guitariz Studio',
          'alternateName': [
            'Guitariz',
            'GuitarizStudio'
          ],
          'description': 'Professional music theory and AI analysis tools for musicians.',
          'inLanguage': 'en-US',
          'publisher': {
            '@id': 'https://guitariz.studio/#organization'
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
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
        },
        {
          '@type': 'Organization',
          '@id': 'https://guitariz.studio/#organization',
          'name': 'Guitariz Studio',
          'url': 'https://guitariz.studio/',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://guitariz.studio/logo2.png',
            'width': 512,
            'height': 512
          },
          'founder': {
            '@type': 'Person',
            'name': 'Abhinav Vaidya',
            'url': 'https://github.com/abhi9vaidya'
          },
          'sameAs': [
            'https://x.com/GuitarizStudio',
            'https://github.com/Guitariz/Guitariz'
          ]
        }
      ]
    })
  },
  {
    url: '/chord-ai',
    title: staticContent.chordAi.title,
    description: staticContent.chordAi.description,
    canonical: 'https://guitariz.studio/chord-ai',
    customHtml: `<div style="margin-top: 32px; line-height: 1.8; color: #d4d4d8;">${staticContent.chordAi.html}</div>`,
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
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
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
    title: 'Free AI Vocal Remover & Stem Splitter | Guitariz',
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
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
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
    url: '/bpm-detector',
    title: 'Free Online BPM Detector & Tap Tempo Finder | Guitariz',
    description: 'Detect the exact BPM (tempo) of any MP3 or audio file online for free. Features real-time AI audio tap tempo finder, metronome sync, and analysis.',
    canonical: 'https://guitariz.studio/bpm-detector',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://guitariz.studio/bpm-detector#app',
          'name': 'Guitariz Online BPM Detector',
          'applicationCategory': 'MusicApplication',
          'operatingSystem': 'Web',
          'description': 'Free online BPM detector and tap tempo finder for songs and audio files.',
          'url': 'https://guitariz.studio/bpm-detector',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
        }
      ]
    })
  },
  {
    url: '/key-detector',
    title: 'Free Online Key Detector & Song Scale Finder | Guitariz',
    description: 'Find the key of any song or audio file for free. AI-powered musical key recognition and scale mode detector for musicians and producers.',
    canonical: 'https://guitariz.studio/key-detector',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://guitariz.studio/key-detector#app',
          'name': 'Guitariz Online Key Detector',
          'applicationCategory': 'MusicApplication',
          'operatingSystem': 'Web',
          'description': 'Free online audio key finder and scale mode detector.',
          'url': 'https://guitariz.studio/key-detector',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
        }
      ]
    })
  },
  {
    url: '/vocal-remover',
    title: 'Free AI Vocal Remover & Acapella Extractor | Guitariz Studio',
    description: 'Separate vocals and instrumentals from any song using AI. High-quality free online vocal remover and acapella stem extraction for karaoke and practice.',
    canonical: 'https://guitariz.studio/vocal-remover',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://guitariz.studio/vocal-remover#app',
          'name': 'Guitariz AI Vocal Remover',
          'applicationCategory': 'MultimediaApplication',
          'operatingSystem': 'Web',
          'description': 'High-quality free online AI vocal remover and stem extraction tool.',
          'url': 'https://guitariz.studio/vocal-remover',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
        }
      ]
    })
  },
  {
    url: '/chord-progression-generator',
    title: 'Free Chord Progression Generator & Harmonic Tools | Guitariz',
    description: 'Generate inspiring chord progressions for guitar, piano, and songwriting. Choose key, mood, or genre with real-time sound playback and MIDI export.',
    canonical: 'https://guitariz.studio/chord-progression-generator',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://guitariz.studio/chord-progression-generator#app',
          'name': 'Guitariz Chord Progression Generator',
          'applicationCategory': 'MusicApplication',
          'operatingSystem': 'Web',
          'description': 'Generate inspiring chord progressions for guitar, piano, and songwriting.',
          'url': 'https://guitariz.studio/chord-progression-generator',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
        }
      ]
    })
  },
  {
    url: '/chordify-alternative',
    title: 'Best Free Chordify Alternative (100% Free) | Guitariz',
    description: 'Looking for a free Chordify alternative? Guitariz offers unlimited AI chord recognition, audio uploads, interactive fretboard sync, and MIDI export 100% free.',
    canonical: 'https://guitariz.studio/chordify-alternative',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://guitariz.studio/chordify-alternative#webpage',
          'name': 'Best Free Chordify Alternative - Guitariz Studio',
          'description': 'Comprehensive comparison between Guitariz Studio and Chordify for AI chord recognition.'
        },
        {
          '@type': 'FAQPage',
          'mainEntity': [
            {
              '@type': 'Question',
              'name': 'Why is Guitariz Studio the best free alternative to Chordify?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Guitariz Studio offers unlimited AI chord recognition for MP3, WAV, and YouTube tracks with no monthly song limits, no paywalls, no ads, and no registration required.'
              }
            }
          ]
        }
      ]
    })
  },
  {
    url: '/moises-alternative',
    title: 'Best Free Moises AI Alternative (Unlimited 6 Stems) | Guitariz',
    description: 'Looking for a free Moises AI alternative? Guitariz provides unlimited 6-stem AI audio separation, zero song duration limits, and free WAV downloads.',
    canonical: 'https://guitariz.studio/moises-alternative',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://guitariz.studio/moises-alternative#webpage',
          'name': 'Best Free Moises AI Alternative - Guitariz Studio',
          'description': 'Comprehensive comparison between Guitariz Studio and Moises AI for stem separation.'
        },
        {
          '@type': 'FAQPage',
          'mainEntity': [
            {
              '@type': 'Question',
              'name': 'Why is Guitariz Studio the best free alternative to Moises AI?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Guitariz Studio offers unlimited 6-stem AI separation (vocals, drums, bass, guitar, piano, other) using Meta\'s Demucs model without monthly track caps, 5-minute song length restrictions, or subscription fees.'
              }
            }
          ]
        }
      ]
    })
  },
  {
    url: '/stem-separator',
    title: staticContent.stemSeparator.title,
    description: staticContent.stemSeparator.description,
    canonical: 'https://guitariz.studio/stem-separator',
    customHtml: `<div style="margin-top: 32px; line-height: 1.8; color: #d4d4d8;">${staticContent.stemSeparator.html}</div>`,
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
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
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
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
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
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
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
    title: staticContent.scales.title,
    description: staticContent.scales.description,
    canonical: 'https://guitariz.studio/scales',
    customHtml: `<div style="margin-top: 32px; line-height: 1.8; color: #d4d4d8;">${staticContent.scales.html}</div>`,
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': 'https://guitariz.studio/scales#app',
      'name': 'Guitariz Scale Explorer',
      'applicationCategory': 'MusicApplication',
      'operatingSystem': 'Web',
      'description': 'Interactive guitar scale explorer for learning scale patterns.',
      'url': 'https://guitariz.studio/scales',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
    })
  },
  {
    url: '/raga-theory',
    title: 'Indian Ragas & Western Scales: The Music Theory Bridge | Guitariz',
    description: 'Hindustani Thaat System & Western Modes: A Comparative Guide. Compare Bilawal, Yaman, Kafi, Bhairav, and other Indian Ragas to Western music modes.',
    canonical: 'https://guitariz.studio/raga-theory',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://guitariz.studio/raga-theory#webpage',
          'url': 'https://guitariz.studio/raga-theory',
          'name': 'Indian Ragas & Western Scales: The Music Theory Bridge',
          'description': 'Bridge the Hindustani Classical music systems (the 10-Thaat classification) and Western music theory modes.'
        },
        {
          '@type': 'FAQPage',
          'mainEntity': [
            {
              '@type': 'Question',
              'name': 'What is the Hindustani Thaat system?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'The Thaat system is a classification framework in Hindustani (North Indian) Classical music, formalized by Pandit Vishnu Narayan Bhatkhande. It consists of exactly ten parent scales (Thaats) from which all ragas are categorized.'
              }
            },
            {
              '@type': 'Question',
              'name': 'How do Western modes map to Indian Thaats?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Six Hindustani Thaats map directly to Western diatonic modes: Bilawal is equivalent to Ionian (Major Scale), Kalyan is Lydian, Khamaj is Mixolydian, Kafi is Dorian, Asavari is Aeolian (Natural Minor), and Bhairavi is Phrygian. The other four Thaats (Bhairav, Todi, Poorvi, Marwa) do not have clean Western diatonic equivalents.'
              }
            }
          ]
        }
      ]
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
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
    })
  },
  {
    url: '/jam',
    title: 'Jam Studio - Loop Chord Progressions with AI Piano & Pads | Guitariz',
    description: 'Practice soloing over looping chord progressions. Set BPM, pick chords, and improvise with scale suggestions on guitar and piano.',
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
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
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
  },
  {
    url: '/gear',
    title: 'Recommended Gear for Musicians | Guitariz Studio',
    description: 'Hand-picked gear recommendations for guitarists and producers. Tuners, capos, headphones, audio interfaces, and music theory books curated by Guitariz Studio.',
    canonical: 'https://guitariz.studio/gear',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': 'https://guitariz.studio/gear#webpage',
      'name': 'Recommended Gear for Musicians',
      'description': 'Curated list of essential gear and accessories for musicians and producers.'
    })
  },
  {
    url: '/privacy',
    title: 'Privacy Policy | Guitariz Studio',
    description: 'Read the Privacy Policy for Guitariz Studio. Learn how we handle your audio uploads, cookies, and data security.',
    canonical: 'https://guitariz.studio/privacy',
    customHtml: `
      <section style="margin-top: 24px; line-height: 1.8; color: #d4d4d8;">
        <h2>Privacy Policy</h2>
        <p>We respect your privacy and protect your data. Audio uploads for Chord AI and Stem Separation are processed in memory and deleted immediately. We disclose the use of Google AdSense advertising cookies and Amazon Associates affiliate links. We do not sell or store personal identity data.</p>
        <p>For more details, visit our website or contact support at support@guitariz.studio.</p>
      </section>
    `,
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Privacy Policy'
    })
  },
  {
    url: '/terms',
    title: 'Terms of Service | Guitariz Studio',
    description: 'Read the Terms of Service for Guitariz Studio. Understand our usage rules, copyright guidelines, and liability provisions.',
    canonical: 'https://guitariz.studio/terms',
    customHtml: `
      <section style="margin-top: 24px; line-height: 1.8; color: #d4d4d8;">
        <h2>Terms of Service</h2>
        <p>By using Guitariz Studio, you agree to our terms. Our tools are free to use. You are responsible for ensuring you have rights to process any audio you upload. We provide the service as-is and exclude liabilities.</p>
        <p>For legal inquiries, contact support@guitariz.studio.</p>
      </section>
    `,
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Terms of Service'
    })
  },
  {
    url: '/about',
    title: 'About Us | Guitariz Studio',
    description: 'Learn more about Guitariz Studio, our mission to build free open-source music tools, and the advanced DSP & AI technology behind them.',
    canonical: 'https://guitariz.studio/about',
    customHtml: `
      <section style="margin-top: 24px; line-height: 1.8; color: #d4d4d8;">
        <h2>Our Mission</h2>
        <p>Guitariz Studio was created to democratize high-performance audio analysis and music theory learning. We believe that tools for transcribing chords, isolating vocals, and exploring scale relationships should not be locked behind expensive subscriptions or restricted by monthly usage caps.</p>
        <h2>The Technology</h2>
        <p>We use a custom Librosa-based digital signal processing pipeline for chord recognition (Harmonic-Percussive Source Separation, chroma feature extraction, and Viterbi HMM smoothing) and Meta's Demucs AI models for 6-stem separation. An advanced CRNN model is currently in development.</p>
        <h2>The Founder</h2>
        <p>Founded by Abhinav Vaidya as an open-source project to make music tools freely accessible to everyone.</p>
      </section>
    `,
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      'name': 'About Us',
      'description': 'Learn about the mission, tech stack, and founder of Guitariz Studio.'
    })
  },
  {
    url: '/contact',
    title: 'Contact Us | Guitariz Studio',
    description: 'Get in touch with the team at Guitariz Studio. Submit bug reports, feature requests, or business inquiries.',
    canonical: 'https://guitariz.studio/contact',
    customHtml: `
      <section style="margin-top: 24px; line-height: 1.8; color: #d4d4d8;">
        <p>If you have any questions, feedback, or support inquiries, please contact us at <strong>support@guitariz.studio</strong>.</p>
        <p>Our code is open-source and hosted on GitHub at <a href="https://github.com/Guitariz/Guitariz" style="color: #3b82f6;">Guitariz Repository</a>.</p>
      </section>
    `,
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      'name': 'Contact Us',
      'description': 'Contact Guitariz Studio support.'
    })
  },
  {
    url: '/cookie-policy',
    title: 'Cookie Policy | Guitariz Studio',
    description: 'Read the Cookie Policy for Guitariz Studio. Understand how we use cookies, third-party services, and tracking techniques to enhance your musical learning.',
    canonical: 'https://guitariz.studio/cookie-policy',
    customHtml: `
      <section style="margin-top: 24px; line-height: 1.8; color: #d4d4d8;">
        <h2>Cookie Policy</h2>
        <p>We use cookies to store user preferences (like theme settings), track anonymous site usage (via Google Analytics and PostHog), and serve advertisements (via Google AdSense) or track affiliate links (via Amazon Associates). You can opt out of personalized ads at Google's Ad Settings.</p>
      </section>
    `,
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Cookie Policy'
    })
  }
];

const distDir = path.resolve(process.cwd(), 'dist');

// --- BLOG COMPILATION & SCHEMA EXTRACTION ---
const blogDir = path.resolve(process.cwd(), 'src/content/blog');
const blogPosts = [];

if (fs.existsSync(blogDir)) {
  const files = fs.readdirSync(blogDir);
  for (const file of files) {
    if (file.endsWith('.md')) {
      const slug = file.replace(/\.md$/, '');
      const rawContent = fs.readFileSync(path.join(blogDir, file), 'utf8');
      const { data, content } = matter(rawContent);
      const htmlContent = marked(content);
      
      const post = {
        slug,
        title: data.title,
        description: data.description,
        date: data.date,
        author: data.author,
        coverImage: data.coverImage,
        category: data.category,
        tags: data.tags || [],
        readTime: data.readTime || '3 min read',
        html: htmlContent
      };
      
      blogPosts.push(post);
    }
  }
}

// Sort blog posts by date descending
blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Save JSON indexes for client-side loading
const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(path.join(publicDir, 'blog-posts.json'), JSON.stringify(blogPosts, null, 2));

const distBlogDir = path.join(distDir, 'blog');
fs.mkdirSync(distBlogDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'blog-posts.json'), JSON.stringify(blogPosts, null, 2));

// Push Blog list page to routes
routes.push({
  url: '/blog',
  title: 'Blog - Guitariz Studio | Music Theory & AI Production Articles',
  description: 'Learn guitar chord transcription by ear, music theory tips, circle of fifths tutorials, and AI stem separation guides.',
  canonical: 'https://guitariz.studio/blog',
  jsonLd: JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'name': 'Guitariz Blog',
    'url': 'https://guitariz.studio/blog',
    'description': 'Music theory, ear training, and AI production articles for musicians.'
  })
});

// Push individual Blog posts to routes
for (const post of blogPosts) {
  routes.push({
    url: `/blog/${post.slug}`,
    title: `${post.title} | Guitariz`,
    description: post.description,
    canonical: `https://guitariz.studio/blog/${post.slug}`,
    htmlContent: post.html,
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          '@id': `https://guitariz.studio/blog/${post.slug}#post`,
          'headline': post.title,
          'description': post.description,
          'datePublished': post.date,
          'dateModified': post.date,
          'author': {
            '@type': 'Person',
            'name': post.author
          },
          'image': post.coverImage,
          'publisher': {
            '@type': 'Organization',
            '@id': 'https://guitariz.studio/#organization',
            'name': 'Guitariz Studio',
            'logo': {
              '@type': 'ImageObject',
              'url': 'https://guitariz.studio/logo2.png',
              'width': 512,
              'height': 512
            }
          },
          'mainEntityOfPage': `https://guitariz.studio/blog/${post.slug}`
        }
      ]
    })
  });
}

// --- PROGRAMMATIC CHORD PAGES GENERATION ---
const ROOT_SLUG_MAP = {
  "C": "c", "C#/Db": "c-sharp", "C#": "c-sharp", "Db": "c-sharp",
  "D": "d", "D#/Eb": "d-sharp", "D#": "d-sharp", "Eb": "d-sharp",
  "E": "e", "F": "f", "F#/Gb": "f-sharp", "F#": "f-sharp", "Gb": "f-sharp",
  "G": "g", "G#/Ab": "g-sharp", "G#": "g-sharp", "Ab": "g-sharp",
  "A": "a", "A#/Bb": "a-sharp", "A#": "a-sharp", "Bb": "a-sharp", "B": "b",
};
const VARIANT_SLUG_MAP = {
  "Major": "major", "Minor": "minor", "7": "7", "maj7": "maj7", "m7": "m7",
  "sus4": "sus4", "sus2": "sus2", "add9": "add9", "dim": "dim", "aug": "aug", "6": "6", "m6": "m6"
};

try {
  const rawChordTs = fs.readFileSync(path.resolve(process.cwd(), 'src/data/chordData.ts'), 'utf8');
  const cleanChordTs = rawChordTs
    .replace(/import [^\n]+/g, '')
    .replace(/type [^\n]+/g, '')
    .replace(/let [^\n]+/g, '')
    .replace(/function buildChordIndex[^\n]+(\n[^\n]+)+?\n\}/g, '')
    .replace(/function getAbbreviatedChordName[^\n]+(\n[^\n]+)+?\n\}/g, '')
    .replace(/export function findChordByName[^\n]+(\n[^\n]+)+?\n\}/g, '')
    .replace(/export const chordLibraryData: ChordLibraryData = /, 'return ');
  
  const chordData = new Function(cleanChordTs)();

  for (const rootObj of chordData.roots) {
    const rootSlug = ROOT_SLUG_MAP[rootObj.root] || rootObj.root.toLowerCase();
    const cleanRootDisplay = rootObj.root.includes('/') ? rootObj.root.split('/')[0] : rootObj.root;

    for (const variant of rootObj.variants) {
      const variantSlug = VARIANT_SLUG_MAP[variant.name] || variant.name.toLowerCase();
      const displayName = `${cleanRootDisplay}${variant.name === 'Major' ? '' : variant.name === 'Minor' ? 'm' : variant.name}`;
      const fullName = `${rootObj.root} ${variant.name}`;
      const chordUrl = `/chords/${rootSlug}/${variantSlug}`;
      const canonical = `https://guitariz.studio${chordUrl}`;

      const voicingsHtml = variant.voicings.map((v, idx) => `
        <div style="margin-top: 16px; padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);">
          <h3 style="font-size: 1rem; color: #fff; margin-bottom: 8px;">Shape ${idx + 1} (${v.position === 0 ? 'Open Position' : 'Fret ' + v.position} - ${v.difficulty || 'Standard'})</h3>
          <p style="font-family: monospace; font-size: 0.9rem; color: #a1a1aa;">Frets [Low E to High e]: [${v.frets.map(f => f === -1 ? 'x' : f).join(', ')}]</p>
        </div>
      `).join('');

      routes.push({
        url: chordUrl,
        title: `${fullName} Guitar Chord (${displayName}) | Voicings, Tabs & Theory | Guitariz`,
        description: `Learn how to play the ${fullName} (${displayName}) guitar chord. Free interactive chord charts, finger positions, tablature, interval formula (${variant.intervals}), and audio previews.`,
        canonical,
        customHtml: `
          <div style="margin-top: 24px; line-height: 1.8; color: #d4d4d8;">
            <p style="font-size: 1.1rem; color: #f4f4f5; margin-bottom: 16px;">${variant.theoryText}</p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px;">
              <span style="padding: 4px 12px; border-radius: 9999px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); font-family: monospace; font-size: 0.85rem;">Formula: ${variant.intervals}</span>
              <span style="padding: 4px 12px; border-radius: 9999px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); font-family: monospace; font-size: 0.85rem;">Voicings: ${variant.voicings.length}</span>
            </div>
            <h2 style="font-size: 1.3rem; font-weight: 600; color: #fff; margin-top: 24px;">Guitar Voicings & Tablature</h2>
            ${voicingsHtml}
          </div>
        `,
        jsonLd: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'MusicComposition',
              '@id': `${canonical}#chord`,
              'name': `${fullName} Guitar Chord`,
              'musicalKey': rootObj.root,
              'description': variant.theoryText,
              'url': canonical
            },
            {
              '@type': 'FAQPage',
              'mainEntity': [
                {
                  '@type': 'Question',
                  'name': `What is the formula for the ${fullName} chord?`,
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': `The ${fullName} chord is built using the interval formula: ${variant.intervals}. ${variant.theoryText}`
                  }
                },
                {
                  '@type': 'Question',
                  'name': `How to play ${displayName} on guitar?`,
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': `Guitariz Studio provides ${variant.voicings.length} interactive voicing shapes with tablature and audio playback for ${displayName}.`
                  }
                }
              ]
            }
          ]
        })
      });
    }
  }
  console.log(`Loaded and queued programmatic chord pages! Total routes now: ${routes.length}`);
} catch (err) {
  console.error('Error generating programmatic chord routes:', err);
}

// Generate sitemap.xml dynamically!
let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const r of routes) {
  const isMain = r.url === '/';
  const priority = isMain ? '1.0' : (r.url.startsWith('/chords/') ? '0.7' : (r.url.startsWith('/blog/') ? '0.6' : '0.8'));
  const freq = isMain ? 'weekly' : (r.url.startsWith('/chords/') ? 'monthly' : (r.url.startsWith('/blog/') ? 'monthly' : 'weekly'));
  sitemapXml += `  <url>\n    <loc>https://guitariz.studio${r.url === '/' ? '/' : r.url}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
}
sitemapXml += `</urlset>\n`;
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml);
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml);
console.log('Generated fresh sitemap.xml dynamically with all tools, blog posts, and chord landing pages!');

const srcIndexPath = path.resolve(distDir, 'index.html');

if (!fs.existsSync(srcIndexPath)) {
  console.error('dist/index.html not found. Run `vite build` first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(srcIndexPath, 'utf8');

function buildRouteBodyHtml(r) {
  if (r.htmlContent) {
    return `<article class="static-blog-content">${r.htmlContent}</article>`;
  }

  let stepsHtml = '';
  let faqHtml = '';

  if (r.jsonLd) {
    try {
      const parsed = JSON.parse(r.jsonLd);
      const graph = parsed['@graph'] || [parsed];
      for (const item of graph) {
        if (item['@type'] === 'HowTo' && item.step && Array.isArray(item.step)) {
          const steps = item.step.map((s) => `<li style="margin-bottom: 8px;">${s.text || s.name || ''}</li>`).join('');
          stepsHtml += `
            <section style="margin-top: 24px; padding: 20px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
              <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 12px; color: #fff;">${item.name || 'How to Use This Tool'}</h2>
              <ol style="padding-left: 20px; color: #a1a1aa; line-height: 1.6;">${steps}</ol>
            </section>
          `;
        }
        if (item['@type'] === 'FAQPage' && item.mainEntity && Array.isArray(item.mainEntity)) {
          const faqs = item.mainEntity.map((q) => `
            <div style="margin-bottom: 16px;">
              <h3 style="font-size: 1rem; font-weight: 600; color: #f4f4f5; margin-bottom: 4px;">${q.name}</h3>
              <p style="color: #a1a1aa; font-size: 0.9rem; line-height: 1.5;">${q.acceptedAnswer?.text || ''}</p>
            </div>
          `).join('');
          faqHtml += `
            <section style="margin-top: 24px; padding: 20px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
              <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 16px; color: #fff;">Frequently Asked Questions</h2>
              ${faqs}
            </section>
          `;
        }
      }
    } catch (err) {
      // Ignore JSON parse errors
    }
  }

  return `
    <div class="prerendered-static-content" style="padding: 32px 16px; max-width: 960px; margin: 0 auto; color: #e4e4e7; font-family: system-ui, -apple-system, sans-serif;">
      <header style="margin-bottom: 24px;">
        <h1 style="font-size: 2.25rem; font-weight: 700; tracking: -0.025em; color: #ffffff; margin-bottom: 12px;">${r.title}</h1>
        <p style="font-size: 1.125rem; color: #a1a1aa; line-height: 1.6; max-width: 720px;">${r.description}</p>
      </header>
      ${r.customHtml || ''}
      ${stepsHtml}
      ${faqHtml}
      <footer style="margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.875rem; color: #71717a;">
        <p>Guitariz Studio is an open-source, AI-powered music learning platform developed by Abhinav Vaidya. Includes Chord AI recognition, stem separation, scale tools, and ear training with no subscription fees.</p>
        <p style="margin-top: 8px;"><a href="https://guitariz.studio/" style="color: #3b82f6; text-decoration: underline;">Visit Guitariz Studio Homepage</a> | <a href="https://github.com/Guitariz/Guitariz" style="color: #3b82f6; text-decoration: underline;">GitHub Repository</a></p>
      </footer>
    </div>
  `;
}

for (const r of routes) {
  const outDir = path.join(distDir, r.url.replace(/^\//, ''));
  const outIndex = r.url === '/' ? path.join(distDir, 'index.html') : path.join(outDir, 'index.html');

  let html = baseHtml;
  
  const bodyContent = buildRouteBodyHtml(r);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>(?=\s*<noscript>)/, `<div id="root">${bodyContent}</div>`);

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

// Submit URLs to IndexNow (Bing, Yandex, Seznam, Naver)
const INDEXNOW_KEY = '39e5f5fc917949c09dd74fcc2584d752';
const indexNowPayload = {
  host: 'guitariz.studio',
  key: INDEXNOW_KEY,
  keyLocation: `https://guitariz.studio/${INDEXNOW_KEY}.txt`,
  urlList: routes.map((r) => `https://guitariz.studio${r.url === '/' ? '' : r.url}`)
};

try {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(indexNowPayload)
  });
  if (res.ok) {
    console.log(`Successfully submitted ${routes.length} URLs to IndexNow! (HTTP ${res.status})`);
  } else {
    console.log(`IndexNow submission response: HTTP ${res.status}`);
  }
} catch (e) {
  console.log(`IndexNow submission skipped: ${e.message}`);
}

