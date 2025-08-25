import { apiRequest } from "@/lib/queryClient";
import type { 
  Consumer, 
  InsertConsumer, 
  ConsumerWithPresence, 
  ConsumptionWithConsumer,
  InsertConsumption 
} from "@shared/schema";

const API_BASE = process.env.NODE_ENV === 'production' ? '' : '';

export const api = {
  // Consumers
  consumers: {
    getAll: (): Promise<Consumer[]> =>
      fetch(`${API_BASE}/api/consommateurs`).then(res => res.json()),
    
    create: (consumer: InsertConsumer): Promise<Consumer> =>
      apiRequest("POST", `${API_BASE}/api/consommateurs`, consumer).then(res => res.json()),
    
    delete: (id: string): Promise<void> =>
      apiRequest("DELETE", `${API_BASE}/api/consommateurs/${id}`).then(() => {}),
  },

  // Presences
  presences: {
    getByDate: (date: string): Promise<ConsumerWithPresence[]> =>
      fetch(`${API_BASE}/api/presences/${date}`).then(res => res.json()),
    
    mark: (presence: { consumerId: string; date: string; isPresent: boolean }): Promise<void> =>
      apiRequest("POST", `${API_BASE}/api/presences`, presence).then(() => {}),
  },

  // Consumptions
  consumptions: {
    getByDate: (date?: string): Promise<ConsumptionWithConsumer[]> => {
      const url = date ? `${API_BASE}/api/consommations?date=${date}` : `${API_BASE}/api/consommations`;
      return fetch(url).then(res => res.json());
    },
    
    create: (consumption: InsertConsumption): Promise<void> =>
      apiRequest("POST", `${API_BASE}/api/consommations`, consumption).then(() => {}),
  },

  // Statistics
  statistics: {
    getDaily: (date?: string): Promise<{
      totalConsumers: number;
      presentToday: number;
      dailyConsumptions: number;
      dailyRevenue: number;
    }> => {
      const url = date ? `${API_BASE}/api/statistics?date=${date}` : `${API_BASE}/api/statistics`;
      return fetch(url).then(res => res.json());
    },
  },

  // Reports
  reports: {
    downloadDaily: (date?: string): Promise<void> => {
      const url = date ? `${API_BASE}/api/rapport/journalier?date=${date}` : `${API_BASE}/api/rapport/journalier`;
      return fetch(url)
        .then(response => {
          if (!response.ok) throw new Error('Erreur lors du téléchargement');
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Rapport_Journalier_${date || new Date().toISOString().split('T')[0]}.docx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        });
    },
  },
};
