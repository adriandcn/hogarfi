import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { imageBase64 } = await req.json()

  if (!imageBase64) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
          {
            type: 'text',
            text: `Analiza este recibo o factura y extrae la información. 
            Responde SOLO con un JSON válido sin markdown, con esta estructura exacta:
            {
              "description": "nombre del negocio o descripción del gasto",
              "amount": 0.00,
              "category": "una de: Comida, Servicios, Entretenimiento, Transporte, Salud, Hogar, Otro",
              "icon": "un emoji relevante para la categoría",
              "date": "fecha en formato YYYY-MM-DD o null si no se ve"
            }
            Si no puedes leer el monto con certeza, pon 0.
            Responde solo el JSON, nada más.`,
          },
        ],
      },
    ],
    max_tokens: 300,
  })

  try {
    const text = response.choices[0].message.content ?? '{}'
    console.log('OpenAI response:', text)
    
    // Limpiar markdown si OpenAI lo incluye
    const clean = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)
    return NextResponse.json(data)
  } catch (e) {
    console.error('Parse error:', e)
    return NextResponse.json({ error: 'Could not parse receipt' }, { status: 422 })
  }
}