import { onRequest } from 'firebase-functions/v2/https';
import { handleCors } from '../_shared/cors';
import { supabase } from '../_shared/supabaseClient';

export const joinLobby = onRequest(
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

      const { lobbyCode, opponentId } = req.body;

      if (!lobbyCode || !opponentId) {
        res.status(400).send('Missing lobbyCode or opponentId');
        return;
      }

      // Check if lobby exists and is available
      const { data: lobby, error: fetchError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('code', lobbyCode)
        .single();

      if (fetchError || !lobby) {
        res.status(404).send('Lobby not found');
        return;
      }

      if (lobby.status !== 'waiting') {
        res.status(400).send('Lobby is not available');
        return;
      }

      if (lobby.host_id === opponentId) {
        res.status(400).send('Cannot join your own lobby');
        return;
      }

      // Update the lobby with the opponent
      const { data: updatedLobby, error: updateError } = await supabase
        .from('lobbies')
        .update({
          opponent_id: opponentId,
          status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('code', lobbyCode)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating lobby:', updateError);
        res.status(500).send('Error joining lobby');
        return;
      }

      res.status(200).json(updatedLobby);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  }
); 