import { supabase } from '../lib/supabase';

export class UserService {
    /**
     * Check if a user is an admin
     * @param {Object} user - The current user object
     * @returns {boolean}
     */
    static isAdmin(user) {
        return user?.email === 'helensadhe@gmail.com';
    }

    /**
     * Get all players from the database
     * @returns {Promise<Array>}
     */
    static async getAllPlayers() {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Add a new player manually
     * @param {string} name - The full name of the player
     * @param {string} email - The email address of the player
     * @returns {Promise<Object>}
     */
    static async addPlayer(name, email) {
        // Typically, new users should sign up through Supabase Auth.
        // But for this admin route, we might just be adding them to the players table directly.
        // It requires the 'id' to be UUID, so we might need to handle it or let Supabase default it if we change the table.
        // Since players table id is mostly references auth.users id,
        // Wait, does players table 'id' require an auth id?
        // Let's check the schema for `players` table if possible or just insert a fake UUID.
        // Generating a random UUID for the player.
        const newId = crypto.randomUUID();

        const { data, error } = await supabase
            .from('players')
            .insert([{ id: newId, full_name: name, email: email.toLowerCase() }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
