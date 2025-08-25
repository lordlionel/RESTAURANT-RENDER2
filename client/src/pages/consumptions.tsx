import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Receipt, Plus } from "lucide-react";
import type { InsertConsumption } from "@shared/schema";

export default function Consumptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConsumer, setSelectedConsumer] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const currentDate = new Date().toISOString().split('T')[0];

  const { data: consumers = [] } = useQuery({
    queryKey: ["/api/consommateurs"],
    queryFn: () => api.consumers.getAll(),
  });

  const { data: consumptions = [], isLoading } = useQuery({
    queryKey: ["/api/consommations", currentDate],
    queryFn: () => api.consumptions.getByDate(currentDate),
  });

  const createConsumptionMutation = useMutation({
    mutationFn: api.consumptions.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consommations", currentDate] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics", currentDate] });
      setSelectedConsumer("");
      setSelectedAmount(0);
      toast({
        title: "Succès",
        description: "Consommation enregistrée avec succès!",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement de la consommation",
        variant: "destructive",
      });
    },
  });

  const handleAddConsumption = () => {
    if (!selectedConsumer || !selectedAmount) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un consommateur et un montant",
        variant: "destructive",
      });
      return;
    }

    const consumption: InsertConsumption = {
      consumerId: selectedConsumer,
      amount: selectedAmount,
      date: currentDate,
    };

    createConsumptionMutation.mutate(consumption);
  };

  const totalRevenue = consumptions.reduce((sum, consumption) => sum + consumption.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Gestion des Consommations</h2>
        <p className="mt-2 text-gray-600">
          {new Date().toLocaleDateString('fr-FR')} - {consumptions.length} consommations - {totalRevenue} FCFA
        </p>
      </div>

      {/* Quick Add Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Ajouter une Consommation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consommateur
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedAmount(700)}
                  variant={selectedAmount === 700 ? "default" : "outline"}
                  className={`flex-1 ${
                    selectedAmount === 700 
                      ? "bg-accent-500 hover:bg-accent-600" 
                      : "border-accent-200 text-accent-700 hover:bg-accent-50"
                  }`}
                  data-testid="button-amount-700"
                >
                  700 F
                </Button>
                <Button
                  onClick={() => setSelectedAmount(1000)}
                  variant={selectedAmount === 1000 ? "default" : "outline"}
                  className={`flex-1 ${
                    selectedAmount === 1000 
                      ? "bg-primary-500 hover:bg-primary-600" 
                      : "border-primary-200 text-primary-700 hover:bg-primary-50"
                  }`}
                  data-testid="button-amount-1000"
                >
                  1000 F
                </Button>
              </div>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAddConsumption}
                disabled={!selectedConsumer || !selectedAmount || createConsumptionMutation.isPending}
                className="w-full bg-success-500 hover:bg-success-600"
                data-testid="button-add-consumption"
              >
                <Receipt className="w-4 h-4 mr-2" />
                {createConsumptionMutation.isPending ? "Ajout..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consumptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Consommations du Jour</CardTitle>
        </CardHeader>
        <CardContent>
          {consumptions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune consommation</h3>
              <p className="text-gray-500">Les consommations de la journée apparaîtront ici</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consommateur</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Heure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumptions.map((consumption) => (
                    <TableRow key={consumption.id} data-testid={`consumption-row-${consumption.id}`}>
                      <TableCell className="font-medium">
                        {consumption.consumer.name}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {consumption.consumer.department || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={consumption.amount === 700 ? "secondary" : "default"}
                          className={consumption.amount === 700 
                            ? "bg-accent-100 text-accent-800" 
                            : "bg-primary-100 text-primary-800"
                          }
                        >
                          {consumption.amount} FCFA
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(consumption.createdAt!).toLocaleTimeString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total: {consumptions.length} consommations
                  </span>
                  <span className="text-2xl font-bold text-primary-600" data-testid="total-revenue">
                    {totalRevenue} FCFA
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
