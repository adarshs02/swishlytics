import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dataDir = path.join(process.cwd(), 'data', 'total_fantasy_scores_by_season');

  try {
    const files = fs.readdirSync(dataDir);
    const seasons = files
      .map(file => {
        if (file.endsWith('_total_scores.csv')) {
          return file.replace('_total_scores.csv', '');
        }
        return null;
      })
      .filter((season): season is string => season !== null);
    
    // Sort seasons descending
    seasons.sort((a, b) => b.localeCompare(a));

    return NextResponse.json(seasons);
  } catch (error) {
    console.error('Error reading seasons directory:', error);
    return NextResponse.json({ message: 'Error reading seasons data' }, { status: 500 });
  }
}
