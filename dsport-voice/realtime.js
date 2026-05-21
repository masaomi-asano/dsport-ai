import { WebSocketServer } from 'ws';

export default async function handler(req, res) {
  if (req.headers.upgrade !== 'websocket') {
    res.status(400).json({ error: 'WebSocket required' });
    return;
  }

  const wss = new WebSocketServer({ noServer: true });

  wss.handleUpgrade(req, req.socket, Buffer.alloc(0), async (twilioWs) => {
    let streamSid = null;
    let systemPrompt = '';
    let openaiWs = null;

    const connectOpenAI = async () => {
      const ws = new WebSocket(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'realtime=v1',
          },
        }
      );

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            turn_detection: { type: 'server_vad' },
            input_audio_format: 'g711_ulaw',
            output_audio_format: 'g711_ulaw',
            voice: 'shimmer',
            instructions: systemPrompt || 'You are a helpful assistant.',
            modalities: ['text', 'audio'],
            temperature: 0.8,
          },
        }));

        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: 'こんにちは' }],
          },
        }));
        ws.send(JSON.stringify({ type: 'response.create' }));
      });

      ws.on('message', (data) => {
        const event = JSON.parse(data.toString());

        if (event.type === 'response.audio.delta' && event.delta) {
          twilioWs.send(JSON.stringify({
            event: 'media',
            streamSid,
            media: { payload: event.delta },
          }));
        }

        if (event.type === 'input_audio_buffer.speech_started') {
          twilioWs.send(JSON.stringify({
            event: 'clear',
            streamSid,
          }));
        }
      });

      ws.on('close', () => twilioWs.close());
      ws.on('error', (err) => console.error('OpenAI WS error:', err));

      return ws;
    };

    twilioWs.on('message', async (data) => {
      const msg = JSON.parse(data.toString());

      if (msg.event === 'start') {
        streamSid = msg.start.streamSid;
        const params = msg.start.customParameters || {};
        systemPrompt = params.systemPrompt || '';
        openaiWs = await connectOpenAI();
      }

      if (msg.event === 'media' && openaiWs?.readyState === 1) {
        openaiWs.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: msg.media.payload,
        }));
      }

      if (msg.event === 'stop') {
        openaiWs?.close();
      }
    });

    twilioWs.on('close', () => openaiWs?.close());
  });
}
