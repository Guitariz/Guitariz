# Confidence-Guided UI Feature

## Overview
This feature enhances the Chord AI analysis by providing real-time confidence scoring and visual guidance to help users identify segments that may need manual review.

## What's New

### Backend Enhancements
- **Dynamic Confidence Scoring**: Enhanced madmom backend to compute real confidence scores (0.70-0.98) based on chroma feature strength instead of fixed values
- **Feature Analysis**: Uses CNN activation patterns and segment feature strength to estimate detection quality
- **Intelligent Scoring**: Lower confidence for ambiguous segments (N.C.) and higher for clear harmonic content

### Frontend Improvements
- **Color-Coded Confidence Badges**: 
  - 🟢 High (≥85%): Green - Excellent detection
  - 🔵 Good (70-84%): Blue - Reliable detection  
  - 🟡 Medium (55-69%): Yellow - May need review
  - 🟠 Low (<55%): Orange - Needs manual review

- **Visual Indicators**: Icons and progress bars change color based on confidence level
- **Review Tags**: Low-confidence segments automatically tagged with "Review" label

### New Components

#### ConfidenceSummary Panel
A comprehensive overview panel showing:
- **Overall Quality Rating**: Excellent / Good / Fair / Needs Review
- **Average Confidence Score**: Aggregate confidence across all segments
- **Statistics Grid**: Count of high/medium/low confidence segments
- **Review List**: Clickable list of low-confidence segments for quick navigation
- **Success Messages**: Positive feedback when all segments have high confidence

## User Benefits

1. **Trust & Transparency**: Users can see which chord detections are highly confident vs uncertain
2. **Efficient Review**: Focus manual correction efforts on low-confidence segments only
3. **Quality Assessment**: Understand overall analysis quality at a glance
4. **Time Savings**: Skip reviewing high-confidence segments that are already accurate

## Technical Details

### Backend (`chord_madmom.py`)
```python
# Confidence calculation based on CNN feature activations
max_activation = float(segment_feats.max())
mean_top = float(np.mean(np.sort(segment_feats.flatten())[-10:]))
confidence = min(0.98, 0.70 + (max_activation * 0.15) + (mean_top * 0.13))
```

### Frontend Components
- `ChordTimeline.tsx`: Enhanced with confidence color coding and icons
- `ConfidenceSummary.tsx`: New panel for confidence overview and review navigation
- `ChordAIPage.tsx`: Integrated ConfidenceSummary in sidebar

## How It Works

1. **Analysis Phase**: During chord detection, the backend computes confidence scores using chroma feature strength
2. **Visualization**: Timeline displays color-coded badges and icons for each segment
3. **Summary**: Confidence panel shows statistics and highlights segments needing review
4. **Navigation**: Users can click on low-confidence segments to jump directly to them

## Future Enhancements
- Editable timeline: Allow users to correct chord labels inline
- Confidence history: Track improvement across multiple analysis runs
- Manual override: Let users mark segments as "verified" after review
- Batch review mode: Dedicated UI for reviewing all low-confidence segments

## Testing
To test the feature:
1. Upload an audio file with varied harmonic content
2. Check the Confidence Summary panel in the sidebar
3. Look for color-coded badges in the timeline
4. Click on low-confidence segments to review them

## Files Modified
- `backend/chord_madmom.py`: Enhanced confidence scoring
- `src/components/chord-ai/ChordTimeline.tsx`: Added confidence visualization
- `src/components/chord-ai/ConfidenceSummary.tsx`: New component
- `src/pages/ChordAIPage.tsx`: Integration
