import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse, validateDataWithAI, suggestDataCorrections, parseNaturalLanguageQuery, suggestDataModifications, generateBusinessRules, recommendRules, mapColumnHeaders } from '@/lib/aiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case 'validateData':
        result = await validateDataWithAI(params.data, params.entityType);
        break;
      
      case 'suggestCorrections':
        result = await suggestDataCorrections(params.data, params.errors);
        break;
      
      case 'parseQuery':
        result = await parseNaturalLanguageQuery(params.query, params.dataStructure);
        break;
      
      case 'suggestModifications':
        result = await suggestDataModifications(params.query, params.data);
        break;
      
      case 'generateRule':
        result = await generateBusinessRules(params.description, params.dataContext);
        break;
      
      case 'recommendRules':
        result = await recommendRules(params.data);
        break;
      
      case 'mapColumns':
        result = await mapColumnHeaders(params.detectedHeaders, params.expectedStructure);
        break;
      
      case 'chat':
        result = await getAIResponse(params.prompt);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'AI service failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
