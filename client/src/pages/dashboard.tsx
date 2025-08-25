import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Users, CheckCircle, DollarSign, Receipt } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedConsumer, setSelectedConsumer] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const currentDate = new Date().toISOString().split('T')[0];

  const { data: consumers = [] } = useQuery({
    queryKey: ["/api/consommateurs"],
    queryFn: () => api.consumers.getAll(),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/statistics", currentDate],
    queryFn: () => api.statistics.getDaily(currentDate),
  });

  const { data: recentConsumptions = [] } = useQuery({
    queryKey: ["/api/consommations", currentDate],
    queryFn: () => api.consumptions.getByDate(currentDate),
  });

  const handleRecordConsumption = async () => {
    if (!selectedConsumer || !selectedAmount) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un consommateur et un montant",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.consumptions.create({
        consumerId: selectedConsumer,
        amount: selectedAmount,
        date: currentDate,
      });
      
      toast({
        title: "Succès",
        description: "Consommation enregistrée avec succès!",
      });
      
      setSelectedConsumer("");
      setSelectedAmount(0);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement de la consommation",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="mt-2 text-gray-600">
          Vue d'ensemble des activités de la cantine - {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="card-hover transition-card" data-testid="stat-total-consumers">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Consommateurs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalConsumers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover transition-card" data-testid="stat-present-today">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ont consommé aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.presentToday || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover transition-card" data-testid="stat-daily-consumptions">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-accent-100 rounded-lg">
                <Receipt className="w-6 h-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Consommations Jour</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.dailyConsumptions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover transition-card" data-testid="stat-daily-revenue">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recette Journalière</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.dailyRevenue || 0} FCFA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center p-4 h-20 bg-primary-50 hover:bg-primary-100 border-primary-200"
              data-testid="button-add-consumer"
            >
              <Users className="w-8 h-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-primary-700">Ajouter Consommateur</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center justify-center p-4 h-20 bg-success-50 hover:bg-success-100 border-success-200"
              data-testid="button-mark-presence"
            >
              <CheckCircle className="w-8 h-8 text-success-600 mb-2" />
              <span className="text-sm font-medium text-success-700">Marquer Présences</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center justify-center p-4 h-20 bg-accent-50 hover:bg-accent-100 border-accent-200"
              data-testid="button-add-consumption"
            >
              <Receipt className="w-8 h-8 text-accent-600 mb-2" />
              <span className="text-sm font-medium text-accent-700">Ajouter Consommation</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center justify-center p-4 h-20 bg-purple-50 hover:bg-purple-100 border-purple-200"
              onClick={() => api.reports.downloadDaily(currentDate)}
              data-testid="button-generate-report"
            >
              <DollarSign className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-700">Générer Rapport</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Consumptions */}
        <Card>
          <CardHeader>
            <CardTitle>Consommations Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentConsumptions.slice(0, 5).map((consumption) => (
                <div key={consumption.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {getInitials(consumption.consumer.name)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{consumption.consumer.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(consumption.createdAt!).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      consumption.amount === 700 
                        ? "bg-accent-100 text-accent-800" 
                        : "bg-primary-100 text-primary-800"
                    }`}>
                      {consumption.amount} F
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Consumption Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Enregistrement Rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un consommateur
                </label>
                <Select value={selectedConsumer} onValueChange={setSelectedConsumer}>
                  <SelectTrigger data-testid="select-consumer">
                    <SelectValue placeholder="Choisir un consommateur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {consumers.map((consumer) => (
                      <SelectItem key={consumer.id} value={consumer.id}>
                        {consumer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Montant du repas
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setSelectedAmount(700)}
                    variant={selectedAmount === 700 ? "default" : "outline"}
                    className={`px-6 py-4 font-medium ${
                      selectedAmount === 700 
                        ? "bg-accent-500 hover:bg-accent-600 text-white" 
                        : "bg-accent-50 hover:bg-accent-100 text-accent-700 border-accent-200"
                    }`}
                    data-testid="button-amount-700"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    700 F
                  </Button>
                  <Button
                    onClick={() => setSelectedAmount(1000)}
                    variant={selectedAmount === 1000 ? "default" : "outline"}
                    className={`px-6 py-4 font-medium ${
                      selectedAmount === 1000 
                        ? "bg-primary-500 hover:bg-primary-600 text-white" 
                        : "bg-primary-50 hover:bg-primary-100 text-primary-700 border-primary-200"
                    }`}
                    data-testid="button-amount-1000"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    1000 F
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleRecordConsumption}
                disabled={!selectedConsumer || !selectedAmount}
                className="w-full bg-success-500 hover:bg-success-600 text-white px-6 py-3 font-medium"
                data-testid="button-record-consumption"
              >
                <Receipt className="w-5 h-5 mr-2" />
                Enregistrer la consommation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
