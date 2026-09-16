import superheroNames from '../data/superheroNames.json';
import moneyHeistNames from '../data/moneyHeistNames.json';
import { supabase } from '../services/supabase';

/**
 * Generates a unique username based on the role
 * @param {string} role - 'client' or 'finisher'
 * @returns {Promise<string>} The unique username
 */
export const generateUniqueUsername = async (role) => {
  const isFinisher = role === 'finisher';
  const namesList = isFinisher ? moneyHeistNames : superheroNames;
  
  // Try up to 10 times to find a completely raw unique name
  for (let i = 0; i < 10; i++) {
    const randomBase = namesList[Math.floor(Math.random() * namesList.length)];
    const candidateName = isFinisher ? `${randomBase} Finisher` : randomBase;

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', candidateName)
      .single();

    if (!data) {
      return candidateName; // It's unique
    }
  }

  // If we couldn't find a raw unique one, append a random number
  const baseName = namesList[Math.floor(Math.random() * namesList.length)];
  const randomSuffix = Math.floor(Math.random() * 900) + 100; // 100-999
  return isFinisher ? `${baseName} Finisher ${randomSuffix}` : `${baseName} ${randomSuffix}`;
};
