import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Loader, FileText, Calendar, Info } from 'lucide-react';
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

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
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
    <div className="max-w-4xl mx-auto px-3 sm:px-4">
      {/* Header responsive */}
      <div className="mb-4 sm:mb-6">
        {/* Bouton retour et titre mobile */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <button
            onClick={() => navigate(`/factures/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 -ml-2"
          >
            <ArrowLeft size={20} />
            <span className="text-sm sm:text-base">Retour</span>
          </button>
          
          <h1 className="text-xl font-bold text-gray-900 sm:hidden">Modifier</h1>
        </div>

        {/* Titre et infos desktop */}
        <div className="hidden sm:block">
          <h1 className="text-2xl font-bold text-gray-900">Modifier la Facture</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-gray-600">
              {facture?.numeroFacture} • {facture?.nomClient}
            </p>
          </div>
        </div>

        {/* Infos mobile */}
        <div className="sm:hidden bg-white rounded-xl p-3 border border-gray-200 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-primary-600" />
            <span className="font-medium text-gray-900">{facture?.numeroFacture}</span>
          </div>
          <p className="text-sm text-gray-600">{facture?.nomClient}</p>
        </div>
      </div>

      {/* Messages d'alerte */}
      {error && <ErrorAlert message={error} />}
      {success && <SuccessAlert message={success} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-6">
        {/* Informations Client */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Informations Client</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du Client *
            </label>
            <input
              {...register('nomClient', { 
                required: 'Le nom du client est obligatoire',
                minLength: { value: 2, message: 'Minimum 2 caractères' }
              })}
              type="text"
              className="input-field w-full py-2.5 sm:py-3 text-sm sm:text-base"
              placeholder="Entrez le nom du client"
            />
            {errors.nomClient && (
              <p className="mt-1 text-sm text-red-600">{errors.nomClient.message}</p>
            )}
          </div>
        </div>

        {/* Lignes de Facture */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lignes de Facture</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={addLigne}
              className="btn btn-primary flex items-center gap-2 w-full sm:w-auto justify-center py-2.5"
            >
              <Plus size={18} />
              <span className="text-sm sm:text-base">Ajouter une ligne</span>
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {lignes.map((ligne, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-700 text-sm sm:text-base">
                      Ligne {index + 1}
                    </span>
                  </div>
                  {lignes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLigne(index)}
                      className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Quantité */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Quantité *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ligne.quantite}
                      onChange={(e) => updateLigne(index, 'quantite', e.target.value)}
                      className="input-field w-full py-2 text-sm sm:text-base"
                      placeholder="1"
                    />
                  </div>

                  {/* Désignation */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Désignation *
                    </label>
                    <input
                      type="text"
                      value={ligne.designation}
                      onChange={(e) => updateLigne(index, 'designation', e.target.value)}
                      className="input-field w-full py-2 text-sm sm:text-base"
                      placeholder="Description du produit/service"
                    />
                  </div>

                  {/* Prix unitaire */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Prix unitaire *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={ligne.prixUnitaire}
                        onChange={(e) => updateLigne(index, 'prixUnitaire', e.target.value)}
                        className="input-field w-full py-2 pr-10 text-sm sm:text-base"
                        placeholder="0"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                        FCFA
                      </div>
                    </div>
                  </div>

                  {/* Montant calculé */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Montant
                    </label>
                    <div className="input-field bg-gray-50 w-full py-2 text-sm sm:text-base flex items-center justify-between">
                      <span className="font-medium">
                        {formatMontant((parseInt(ligne.quantite) || 0) * (parseFloat(ligne.prixUnitaire) || 0))}
                      </span>
                      <span className="text-gray-500 text-xs">FCFA</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Total de la facture</h2>
              <p className="text-xs sm:text-sm text-gray-600">Montant total à facturer</p>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-primary-600">
              {formatMontant(total)} FCFA
            </div>
          </div>
          
          <div className="space-y-2">
            {facture?.totalEnLettres && (
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <Info size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
                <p className="italic">{facture.totalEnLettres}</p>
              </div>
            )}
            <p className="text-sm sm:text-base text-gray-600">
              Montant total: <span className="font-medium">{formatMontant(total)} Francs CFA</span>
            </p>
          </div>
        </div>

        {/* Informations système */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText size={18} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Informations système</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Numéro de facture
              </label>
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-gray-400" />
                <p className="text-gray-900 font-medium text-sm sm:text-base truncate">
                  {facture?.numeroFacture}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Date de création
              </label>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <p className="text-gray-900 text-sm sm:text-base">
                  {formatDate(facture?.dateFacturation)}
                </p>
              </div>
            </div>
            
            {/* Informations paiement si disponibles */}
            {facture?.statutPaiement && (
              <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100 sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  État des paiements
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      facture?.resteAPayer === 0 ? 'bg-green-500' : 
                      facture?.resteAPayer === facture?.total ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">
                      {facture?.statutPaiement === 'PAYEE' ? 'Payée' :
                       facture?.statutPaiement === 'PARTIELLEMENT_PAYEE' ? 'Partiellement payée' : 'Impayée'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {facture?.montantPaye > 0 && (
                      <span className="font-medium text-green-600">
                        Payé: {formatMontant(facture.montantPaye)} FCFA
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions stickées pour mobile */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 sm:p-4 -mx-3 sm:-mx-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate(`/factures/${id}`)}
                className="btn btn-secondary order-2 sm:order-1 py-2.5"
                disabled={saving}
              >
                <span className="text-sm sm:text-base">Annuler</span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex items-center gap-2 justify-center order-1 sm:order-2 py-2.5"
              >
                {saving ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    <span className="text-sm sm:text-base">Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span className="text-sm sm:text-base">Enregistrer les modifications</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditFacture;