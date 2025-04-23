import { onRequest } from 'firebase-functions/v2/https';
import { handleCors } from '../_shared/cors';
import { supabase } from '../_shared/supabaseClient';

export const startMatch = onRequest(
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

      const { lobbyCode, problemId } = req.body;

      if (!lobbyCode || !problemId) {
        res.status(400).send('Missing lobbyCode or problemId');
        return;
      }

      // Check if lobby exists and is ready
      const { data: lobby, error: fetchError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('code', lobbyCode)
        .single();

      if (fetchError || !lobby) {
        res.status(404).send('Lobby not found');
        return;
      }

      if (lobby.status !== 'ready') {
        res.status(400).send('Lobby is not ready to start');
        return;
      }

      // Update the lobby to start the match
      const { data: updatedLobby, error: updateError } = await supabase
        .from('lobbies')
        .update({
          status: 'in_progress',
          problem_id: problemId,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('code', lobbyCode)
        .select()
        .single();

      if (updateError) {
        console.error('Error starting match:', updateError);
        res.status(500).send('Error starting match');
        return;
      }

      res.status(200).json(updatedLobby);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  }
); 