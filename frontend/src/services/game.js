import api from './api';

const gameService = {
  //contenitore delle task
  getSessions: async () => {
    const response = await api.get('sessions/');
    return response.data;
  },

  //lista delle task
  getTasks: async () => {
    const response = await api.get('tasks/');
    return response.data;
  },
  
  
  grabTask: async (taskId) => {
    const response = await api.post(`tasks/${taskId}/grab/`);
    return response.data;
  },

  // recupera le task che devono ancora ricevere il proprio voto 
  getAwaitingRatings: async ()=> {
    const response = await api.get('tasks/?status=completed&needs_rating=true');
    return response.data;
  },


  completeAssignment: async (assignmentId) => {
    const response = await api.post(`assignments/${assignmentId}/complete/`);
    return response.data; //restituisce i punti guadagnati
  },


  submitRating: async (assignmentId, stars, comment) => {
    const response = await api.post('ratings/', {
      assignment: assignmentId,
      stars: stars, // Numero da 1 a 5
      comment: comment
    });
    return response.data;
  }
};

export default gameService;