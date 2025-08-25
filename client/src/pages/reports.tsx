import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Calendar, TrendingUp } from "lucide-react";

export default function Reports() {
  const { toast } = useToast();
  const currentDate = new Date().toISOString().split('T')[0];

  const { data: stats } = useQuery({
    queryKey: ["/api/statistics", currentDate],
    queryFn: () => api.statistics.getDaily(currentDate),
  });

  const { data: consumptions = [] } = useQuery({
    queryKey: ["/api/consommations", currentDate],
    queryFn: () => api.consumptions.getByDate(currentDate),
  });

  const handleExportDaily = async () => {
    try {
      await api.reports.downloadDaily(currentDate);
      toast({
        title: "Succès",
        description: "Rapport journalier téléchargé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement du rapport",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Rapports et Statistiques</h2>
        <p className="mt-2 text-gray-600">
          Génération et export des rapports - {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Daily Report */}
        <Card className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <CardContent className="p-0">
            <div className="w-12 h-12 bg-primary-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Rapport Journalier</h4>
            <p className="text-sm text-gray-600 mb-4">
              Export Word avec toutes les consommations du jour
            </p>
            <Button
              onClick={handleExportDaily}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white"
              data-testid="button-export-daily"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger (.docx)
            </Button>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card className="text-center p-6 bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <CardContent className="p-0">
            <div className="w-12 h-12 bg-success-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Résumé Hebdomadaire</h4>
            <p className="text-sm text-gray-600 mb-4">
              Statistiques de la semaine en cours
            </p>
            <Button
              variant="outline"
              className="w-full bg-success-500 hover:bg-success-600 text-white border-success-500"
              data-testid="button-weekly-summary"
            >
              Voir le résumé
            </Button>
          </CardContent>
        </Card>

        {/* Monthly Analytics */}
        <Card className="text-center p-6 bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
          <CardContent className="p-0">
            <div className="w-12 h-12 bg-accent-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Analyse Mensuelle</h4>
            <p className="text-sm text-gray-600 mb-4">
              Tendances et analytics du mois
            </p>
            <Button
              variant="outline"
              className="w-full bg-accent-500 hover:bg-accent-600 text-white border-accent-500"
              data-testid="button-monthly-analytics"
            >
              Générer analyse
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Daily Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Statistiques du Jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Consommateurs</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {stats?.totalConsumers || 0}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Présents Aujourd'hui</span>
                <Badge className="bg-success-100 text-success-800 text-lg px-3 py-1">
                  {stats?.presentToday || 0}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Consommations</span>
                <Badge className="bg-accent-100 text-accent-800 text-lg px-3 py-1">
                  {stats?.dailyConsumptions || 0}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-semibold text-gray-900">Recette Totale</span>
                <span className="text-2xl font-bold text-primary-600" data-testid="total-daily-revenue">
                  {stats?.dailyRevenue || 0} FCFA
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des Montants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const count700 = consumptions.filter(c => c.amount === 700).length;
                const count1000 = consumptions.filter(c => c.amount === 1000).length;
                const revenue700 = count700 * 700;
                const revenue1000 = count1000 * 1000;
                
                return (
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-600">Repas à 700 FCFA</span>
                        <p className="text-sm text-gray-500">{count700} repas</p>
                      </div>
                      <Badge className="bg-accent-100 text-accent-800 text-lg px-3 py-1">
                        {revenue700} FCFA
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-600">Repas à 1000 FCFA</span>
                        <p className="text-sm text-gray-500">{count1000} repas</p>
                      </div>
                      <Badge className="bg-primary-100 text-primary-800 text-lg px-3 py-1">
                        {revenue1000} FCFA
                      </Badge>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-accent-500 h-4 rounded-l-full" 
                          style={{ 
                            width: `${(revenue700 / (revenue700 + revenue1000)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>700F ({((revenue700 / (revenue700 + revenue1000)) * 100).toFixed(1)}%)</span>
                        <span>1000F ({((revenue1000 / (revenue700 + revenue1000)) * 100).toFixed(1)}%)</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Export History */}
      <Card>
        <CardHeader>
          <CardTitle>Derniers rapports générés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Rapport_Journalier_{currentDate.replace(/-/g, '_')}.docx
                  </p>
                  <p className="text-xs text-gray-500">
                    Généré aujourd'hui - {stats?.dailyRevenue || 0} FCFA
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDaily}
                data-testid="button-redownload"
              >
                <Download className="w-4 h-4 mr-2" />
                Retélécharger
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
