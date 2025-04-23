import { onRequest } from 'firebase-functions/v2/https';
import { handleCors } from '../_shared/cors';
import { supabase } from '../_shared/supabaseClient';

export const createLobby = onRequest(
  {
    timeoutSeconds: 300,
    memory: '256MiB',
    region: 'us-central1'
  },
  async (req, res) => {
    try {
      await handleCors(req, res);

      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const { hostId } = req.body;

      if (!hostId) {
        res.status(400).send('Missing hostId');
        return;
      }

      // Generate a random 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create the lobby in Supabase
      const { data: lobby, error } = await supabase
        .from('lobbies')
        .insert([
          {
            code,
            host_id: hostId,
            status: 'waiting',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating lobby:', error);
        res.status(500).send('Error creating lobby');
        return;
      }

      res.status(200).json(lobby);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  }
); 