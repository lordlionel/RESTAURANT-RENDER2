import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus, Users } from "lucide-react";
import type { InsertConsumer } from "@shared/schema";

export default function Consumers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newConsumer, setNewConsumer] = useState<InsertConsumer>({
    name: "",
    department: "",
  });

  const { data: consumers = [], isLoading } = useQuery({
    queryKey: ["/api/consommateurs"],
    queryFn: () => api.consumers.getAll(),
  });

  const createConsumerMutation = useMutation({
    mutationFn: api.consumers.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consommateurs"] });
      setIsDialogOpen(false);
      setNewConsumer({ name: "", department: "" });
      toast({
        title: "Succès",
        description: "Consommateur ajouté avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout du consommateur",
        variant: "destructive",
      });
    },
  });

  const deleteConsumerMutation = useMutation({
    mutationFn: api.consumers.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consommateurs"] });
      toast({
        title: "Succès",
        description: "Consommateur supprimé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du consommateur",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConsumer.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom est requis",
        variant: "destructive",
      });
      return;
    }
    createConsumerMutation.mutate(newConsumer);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce consommateur ?")) {
      deleteConsumerMutation.mutate(id);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestion des Consommateurs</h2>
          <p className="mt-2 text-gray-600">
            Total: {consumers.length} consommateurs
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary-500 hover:bg-primary-600" data-testid="button-add-consumer">
              <UserPlus className="w-5 h-5 mr-2" />
              Ajouter un consommateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau Consommateur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={newConsumer.name}
                  onChange={(e) => setNewConsumer({ ...newConsumer, name: e.target.value })}
                  placeholder="Ex: Jean Dupont"
                  required
                  data-testid="input-consumer-name"
                />
              </div>
              
              <div>
                <Label htmlFor="department">Département</Label>
                <Input
                  id="department"
                  value={newConsumer.department || ""}
                  onChange={(e) => setNewConsumer({ ...newConsumer, department: e.target.value })}
                  placeholder="Ex: Ressources Humaines"
                  data-testid="input-consumer-department"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={createConsumerMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-consumer"
                >
                  {createConsumerMutation.isPending ? "Ajout..." : "Ajouter"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel-consumer"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {consumers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun consommateur</h3>
            <p className="text-gray-500 mb-6">Commencez par ajouter votre premier consommateur</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary-500 hover:bg-primary-600">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Ajouter le premier consommateur
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consumers.map((consumer) => (
            <Card key={consumer.id} className="card-hover transition-card" data-testid={`card-consumer-${consumer.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-primary-600">
                        {getInitials(consumer.name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{consumer.name}</h3>
                      {consumer.department && (
                        <p className="text-sm text-gray-500">{consumer.department}</p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(consumer.id)}
                    disabled={deleteConsumerMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`button-delete-${consumer.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
