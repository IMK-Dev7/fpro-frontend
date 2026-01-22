import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Loader } from 'lucide-react';
import { factureService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';

const EditFacture = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [facture, setFacture] = useState(null);
  
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm();

  const lignes = watch('lignes') || [];

  useEffect(() => {
    loadFacture();
  }, [id]);

  const loadFacture = async () => {
    try {
      setLoading(true);
      const response = await factureService.getById(id);
      setFacture(response.data);
      
      reset({
        nomClient: response.data.nomClient,
        lignes: response.data.lignes.map(ligne => ({
          id: ligne.id,
          quantite: ligne.quantite,
          designation: ligne.designation,
          prixUnitaire: ligne.prixUnitaire
        }))
      });
    } catch (err) {
      setError('Erreur lors du chargement de la facture');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

    setSaving(true);
    setError(null);

    try {
      const factureData = {
        nomClient: data.nomClient,
        lignes: data.lignes.map(ligne => ({
          id: ligne.id,
          quantite: parseInt(ligne.quantite),
          designation: ligne.designation.trim(),
          prixUnitaire: parseFloat(ligne.prixUnitaire)
        }))
      };

      await factureService.update(id, factureData);
      setSuccess('Facture modifiée avec succès !');
      
      setTimeout(() => {
        loadFacture();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification de la facture');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !facture) return <ErrorAlert message={error} onRetry={() => navigate('/factures')} />;

  const total = calculateTotal();

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header responsive */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate(`/factures/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-3 -ml-2 p-2"
        >
          <ArrowLeft size={20} />
          <span className="text-sm sm:text-base">Retour</span>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Modifier la Facture</h1>
        <p className="text-sm sm:text-base text-gray-600">
          {facture?.numeroFacture} - Modifiez les informations
        </p>
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
              <span className="text-sm sm:text-base">Ajouter une ligne</span>
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
                        step="0.01"
                        value={ligne.prixUnitaire}
                        onChange={(e) => updateLigne(index, 'prixUnitaire', e.target.value)}
                        className="input-field text-sm sm:text-base"
                        placeholder="0.00"
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
          
          <div className="text-xs sm:text-sm text-gray-600 space-y-1">
            {facture?.totalEnLettres && (
              <p className="mb-2 italic">{facture.totalEnLettres}</p>
            )}
            <p>Montant total: {total.toLocaleString('fr-FR')} Francs CFA</p>
          </div>
        </div>

        {/* Informations système */}
        <div className="bg-gray-50 rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations système</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">
                Numéro de facture
              </label>
              <p className="text-gray-900 font-medium text-sm sm:text-base">{facture?.numeroFacture}</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">
                Date de création
              </label>
              <p className="text-gray-900 text-sm sm:text-base">
                {new Date(facture?.dateFacturation).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate(`/factures/${id}`)}
            className="btn btn-secondary order-2 sm:order-1"
            disabled={saving}
          >
            <span className="text-sm sm:text-base">Annuler</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary flex items-center gap-2 justify-center order-1 sm:order-2"
          >
            {saving ? (
              <>
                <Loader className="animate-spin" size={18} />
                <span className="text-sm sm:text-base">Enregistrement...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span className="text-sm sm:text-base">Enregistrer</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditFacture;