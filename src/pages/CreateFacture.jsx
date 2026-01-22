import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { factureService } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';

const CreateFacture = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: {
      nomClient: '',
      lignes: [
        { quantite: 1, designation: '', prixUnitaire: 0 }
      ]
    }
  });

  const lignes = watch('lignes') || [];

  const addLigne = () => {
    const newLignes = [...lignes, { quantite: 1, designation: '', prixUnitaire: 0 }];
    setValue('lignes', newLignes);
  };

  const removeLigne = (index) => {
    if (lignes.length <= 1) {
      setError('Une facture doit avoir au moins une ligne');
      return;
    }
    const newLignes = lignes.filter((_, i) => i !== index);
    setValue('lignes', newLignes);
  };

  const updateLigne = (index, field, value) => {
    const newLignes = [...lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    setValue('lignes', newLignes);
  };

  const calculateTotal = () => {
    return lignes.reduce((total, ligne) => {
      const quantite = parseInt(ligne.quantite) || 0;
      const prix = parseFloat(ligne.prixUnitaire) || 0;
      return total + (quantite * prix);
    }, 0);
  };

  const onSubmit = async (data) => {
    const invalidLignes = data.lignes.filter(l => 
      !l.designation.trim() || 
      !l.quantite || 
      l.quantite <= 0 || 
      !l.prixUnitaire || 
      l.prixUnitaire < 0
    );

    if (invalidLignes.length > 0) {
      setError('Veuillez remplir correctement toutes les lignes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const factureData = {
        nomClient: data.nomClient,
        lignes: data.lignes.map(ligne => ({
          quantite: parseInt(ligne.quantite),
          designation: ligne.designation.trim(),
          prixUnitaire: parseFloat(ligne.prixUnitaire)
        }))
      };

      const response = await factureService.create(factureData);
      setSuccess('Facture créée avec succès !');
      
      setTimeout(() => {
        navigate(`/factures/${response.data.id}`);
      }, 2000);

      reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la facture');
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header mobile-friendly */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/factures')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 -ml-2 p-2"
        >
          <ArrowLeft size={20} />
          <span className="text-sm sm:text-base">Retour</span>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nouvelle Facture</h1>
        <p className="text-sm sm:text-base text-gray-600">Remplissez les informations</p>
      </div>

      {error && <ErrorAlert message={error} />}
      {success && <SuccessAlert message={success} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {/* Informations Client */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Informations Client</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du Client *
            </label>
            <input
              {...register('nomClient', { required: 'Le nom du client est obligatoire' })}
              type="text"
              className="input-field text-sm sm:text-base"
              placeholder="Entrez le nom du client"
            />
            {errors.nomClient && (
              <p className="mt-1 text-sm text-red-600">{errors.nomClient.message}</p>
            )}
          </div>
        </div>

        {/* Lignes de Facture */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lignes de Facture</h2>
            <button
              type="button"
              onClick={addLigne}
              className="btn btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Plus size={18} />
              <span>Ajouter une ligne</span>
            </button>
          </div>

          <div className="space-y-4">
            {lignes.map((ligne, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-medium text-gray-700 text-sm sm:text-base">
                    Ligne {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLigne(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                    disabled={lignes.length <= 1}
                    aria-label="Supprimer la ligne"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Quantité */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantité *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ligne.quantite}
                      onChange={(e) => updateLigne(index, 'quantite', e.target.value)}
                      className="input-field text-sm sm:text-base"
                      placeholder="1"
                    />
                  </div>

                  {/* Désignation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Désignation *
                    </label>
                    <input
                      type="text"
                      value={ligne.designation}
                      onChange={(e) => updateLigne(index, 'designation', e.target.value)}
                      className="input-field text-sm sm:text-base"
                      placeholder="Description du produit/service"
                    />
                  </div>

                  {/* Prix unitaire et Montant en ligne sur mobile */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix unitaire *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={ligne.prixUnitaire}
                        onChange={(e) => updateLigne(index, 'prixUnitaire', e.target.value)}
                        className="input-field text-sm sm:text-base"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Montant
                      </label>
                      <div className="input-field bg-gray-50 text-sm sm:text-base flex items-center justify-between">
                        <span>
                          {((parseInt(ligne.quantite) || 0) * (parseFloat(ligne.prixUnitaire) || 0)).toFixed(2)}
                        </span>
                        <span className="text-gray-500 text-xs">FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Total</h2>
            <div className="text-xl sm:text-2xl font-bold text-primary-600">
              {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA
            </div>
          </div>
          
          <div className="text-xs sm:text-sm text-gray-600">
            {total > 0 ? (
              <p>Montant total: {total.toLocaleString('fr-FR')} Francs CFA</p>
            ) : (
              <p className="text-yellow-600">Ajoutez des lignes pour calculer le total</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/factures')}
            className="btn btn-secondary order-2 sm:order-1"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center gap-2 justify-center order-1 sm:order-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm sm:text-base">Création en cours...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span className="text-sm sm:text-base">Créer la facture</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFacture;
