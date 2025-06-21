import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathnameParts = url.pathname.split('/');
  // The pathname is /api/seasons/[season]/total_rankings, so the season is the 3rd to last part
  const season = pathnameParts[pathnameParts.length - 2];
  const filePath = path.join(
    process.cwd(),
    'data',
    'total_fantasy_scores_by_season',
    `${season}_total_scores.csv`
  );

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const parseResult = Papa.parse(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
    });


    const formattedData = (parseResult.data as any[]).map((row) => {
      if (row && typeof row.Total_Fantasy_ZScore === 'number') {
        row.Total_Fantasy_ZScore = parseFloat(row.Total_Fantasy_ZScore.toFixed(3));
      }
      return row;
    });

    return NextResponse.json(formattedData);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ message: `Data for season ${season} not found.` }, { status: 404 });
    }
    console.error(`Error processing data for season ${season}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
