import { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Save,
  FileDown,
  Camera,
  X,
  Loader2,
  Users,
  AlertCircle,
} from 'lucide-react';
import {
  comiteSchema,
  RUTAS_ARTICULACION,
  buildCargos,
  type ComiteFormData,
} from '../types/comiteSchema';
import { ESTADOS_MUNICIPIOS, ESTADOS } from '../data/municipios';
import { generateFolioPreview } from '../lib/folioGenerator';
import { generateActaPDF, previewActaPDF } from '../lib/pdfGenerator';
import { compressImage } from '../lib/imageUtils';
import { useComiteStore } from '../store/comiteStore';
import { useAuthStore } from '../store/authStore';
import { createComite } from '../api/comites';

function buildIntegrantes(count: number) {
  const cargos = buildCargos(count);
  return cargos.map((cargo) => ({
    cargo,
    nombre: '',
    sexo: 'H' as const,
    edad: 12,
    municipio: '',
    telefono: '',
    email: '',
    poblacionVulnerable: [] as string[],
  }));
}

export default function RegistroComite() {
  const { isLoading, setIsLoading } =
    useComiteStore();
  const { role: userRole, assignedStates } = useAuthStore();
  // Territorial and admin can register in any state; others only their assigned states
  const canRegisterAnyState = userRole === 'administrador' || userRole === 'territorial';
  const availableEstados = canRegisterAnyState ? ESTADOS : ESTADOS.filter((e) => assignedStates.includes(e));
  // Pre-select the only available state if user has exactly one
  const defaultEstado = availableEstados.length === 1 ? availableEstados[0] : '';
  const [numIntegrantes, setNumIntegrantes] = useState(5);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [folioPreview, setFolioPreview] = useState('---');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ComiteFormData>({
    resolver: zodResolver(comiteSchema),
    defaultValues: {
      fechaProtesta: '',
      rutaArticulacion: undefined,
      estado: defaultEstado,
      lugarIntervencion: '',
      nombreComite: '',
      tiktok: '',
      instagram: '',
      modoIntegrantes: '5',
      integrantes: buildIntegrantes(5),
      ejesTematicos: '',
      actividades: '',
      evidenciaFotografica: '',
      observaciones: '',
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: 'integrantes',
  });

  const watchEstado = watch('estado');
  const municipiosDisponibles = watchEstado
    ? ESTADOS_MUNICIPIOS[watchEstado] || []
    : [];

  const updateFolioPreview = useCallback(() => {
    const estado = watch('estado');
    const ruta = watch('rutaArticulacion');
    const lugar = watch('lugarIntervencion');
    setFolioPreview(generateFolioPreview(estado, lugar || 'XXXX', ruta));
  }, [watch]);

  const handleNumChange = (num: number) => {
    setNumIntegrantes(num);
    setValue('modoIntegrantes', String(num));
    replace(buildIntegrantes(num));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.7);
      setPhotoPreview(compressed);
      setValue('evidenciaFotografica', compressed);
    } catch (err) {
      console.error('Error comprimiendo imagen:', err);
    }
    e.target.value = '';
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setValue('evidenciaFotografica', '');
  };

  const onSubmit = async (data: ComiteFormData) => {
    setIsLoading(true);
    setSuccessMsg('');

    try {
      const recordFromApi = await createComite(data);
      await generateActaPDF(recordFromApi);

      setSuccessMsg(`Acta registrada con folio: ${recordFromApi.folio}`);
      reset({ estado: defaultEstado });
      setPhotoPreview(null);
      setNumIntegrantes(5);
      replace(buildIntegrantes(5));
      setFolioPreview('---');
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('Error al guardar el acta. Revise los datos e intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const errList = Object.entries(errors);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 font-medium text-center">
          {successMsg}
        </div>
      )}

      {errList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
            <AlertCircle size={18} />
            Errores en el formulario
          </div>
          <ul className="text-sm text-red-600 list-disc list-inside">
            {errList.map(([key, err]) => (
              <li key={key}>
                {typeof err === 'object' && 'message' in err
                  ? (err as { message?: string }).message
                  : key}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mode selector + Folio Preview */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="text-teal" size={24} />
            <span className="font-bold text-gray-700">Integrantes:</span>
            <select
              value={numIntegrantes}
              onChange={(e) => handleNumChange(Number(e.target.value))}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all font-bold text-guinda bg-white min-w-[140px] sm:min-w-[180px]"
            >
              {Array.from({ length: 11 }, (_, i) => i + 5).map((n) => (
                <option key={n} value={n}>
                  {n} Integrantes
                </option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Vista previa de folio
            </p>
            <p className="font-mono text-lg font-bold text-teal">
              {folioPreview}
            </p>
          </div>
        </div>
      </div>

      {/* DATOS DEL COMITÉ */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="bg-guinda text-white px-6 py-3 text-sm font-bold tracking-widest text-center">
          DATOS DEL COMITÉ
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-teal uppercase tracking-wider mb-1">
              Fecha de Toma de Protesta
            </label>
            <input
              type="date"
              {...register('fechaProtesta')}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all"
            />
            {errors.fechaProtesta && (
              <p className="text-red-500 text-xs mt-1">{errors.fechaProtesta.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-teal uppercase tracking-wider mb-1">
              Ruta de Articulación
            </label>
            <select
              {...register('rutaArticulacion', {
                onChange: () => updateFolioPreview(),
              })}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all input-uppercase"
            >
              <option value="">Seleccionar...</option>
              {RUTAS_ARTICULACION.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {errors.rutaArticulacion && (
              <p className="text-red-500 text-xs mt-1">
                {errors.rutaArticulacion.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-teal uppercase tracking-wider mb-1">
              Estado
            </label>
            <select
              {...register('estado', {
                onChange: () => updateFolioPreview(),
              })}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all input-uppercase"
            >
              <option value="">Seleccionar estado...</option>
              {availableEstados.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            {errors.estado && (
              <p className="text-red-500 text-xs mt-1">{errors.estado.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-teal uppercase tracking-wider mb-1">
              Lugar de Intervención del Comité
            </label>
            <select
              {...register('lugarIntervencion', {
                onChange: () => updateFolioPreview(),
              })}
              disabled={!watchEstado}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400 input-uppercase"
            >
              <option value="">
                {watchEstado
                  ? 'Seleccionar municipio...'
                  : 'Primero seleccione estado'}
              </option>
              {municipiosDisponibles.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {errors.lugarIntervencion && (
              <p className="text-red-500 text-xs mt-1">
                {errors.lugarIntervencion.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-teal uppercase tracking-wider mb-1">
              Nombre del Comité
            </label>
            <input
              type="text"
              {...register('nombreComite')}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all input-uppercase"
              placeholder="Nombre del comité"
            />
            {errors.nombreComite && (
              <p className="text-red-500 text-xs mt-1">{errors.nombreComite.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-teal uppercase tracking-wider mb-1">
              TikTok
            </label>
            <input
              type="text"
              {...register('tiktok')}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all"
              placeholder="@usuario"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-teal uppercase tracking-wider mb-1">
              Instagram
            </label>
            <input
              type="text"
              {...register('instagram')}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all"
              placeholder="@usuario"
            />
          </div>
        </div>
      </div>

      {/* DATOS DE INTEGRANTES */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="bg-guinda text-white px-6 py-3 text-sm font-bold tracking-widest text-center">
          DATOS DE INTEGRANTES
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 700 }}>
            <thead>
              <tr className="bg-teal-50 text-teal">
                <th className="px-3 py-2 text-left font-bold text-xs uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-3 py-2 text-left font-bold text-xs uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-3 py-2 text-center font-bold text-xs uppercase tracking-wider">
                  Sexo
                </th>
                <th className="px-3 py-2 text-center font-bold text-xs uppercase tracking-wider">
                  Edad
                </th>
                <th className="px-3 py-2 text-left font-bold text-xs uppercase tracking-wider">
                  Municipio
                </th>
                <th className="px-3 py-2 text-left font-bold text-xs uppercase tracking-wider">
                  Teléfono
                </th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr
                  key={field.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                >
                  <td className="px-3 py-1.5">
                    <span className="inline-block bg-teal text-white text-xs font-bold px-2 py-1 rounded">
                      {field.cargo}
                    </span>
                    <input
                      type="hidden"
                      {...register(`integrantes.${index}.cargo`)}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      {...register(`integrantes.${index}.nombre`)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded focus:border-teal focus:ring-1 focus:ring-teal/20 outline-none input-uppercase text-sm"
                      placeholder="Nombre completo"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      {...register(`integrantes.${index}.sexo`)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded focus:border-teal outline-none text-sm text-center"
                    >
                      <option value="H">H</option>
                      <option value="M">M</option>
                      <option value="X">X</option>
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      {...register(`integrantes.${index}.edad`, {
                        valueAsNumber: true,
                      })}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded focus:border-teal outline-none text-sm text-center"
                    >
                      <option value="">Edad</option>
                      {Array.from({ length: 18 }, (_, i) => i + 12).map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      {...register(`integrantes.${index}.municipio`)}
                      disabled={!watchEstado}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded focus:border-teal outline-none text-sm disabled:bg-gray-100 input-uppercase"
                    >
                      <option value="">Municipio...</option>
                      {municipiosDisponibles.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="tel"
                      {...register(`integrantes.${index}.telefono`)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded focus:border-teal outline-none text-sm"
                      placeholder="10 dígitos"
                      maxLength={10}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {errors.integrantes && (
          <p className="text-red-500 text-xs px-6 pb-3">
            {typeof errors.integrantes.message === 'string'
              ? errors.integrantes.message
              : 'Revise los datos de integrantes'}
          </p>
        )}
      </div>

      {/* PROYECTO DE TRABAJO */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="bg-guinda text-white px-6 py-3 text-sm font-bold tracking-widest text-center">
          PROYECTO DE TRABAJO
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-teal uppercase tracking-wider mb-1">
              Ejes Temáticos de Interés
            </label>
            <textarea
              {...register('ejesTematicos')}
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all resize-y input-uppercase"
              placeholder="Describa los ejes temáticos..."
            />
            {errors.ejesTematicos && (
              <p className="text-red-500 text-xs mt-1">
                {errors.ejesTematicos.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-teal uppercase tracking-wider mb-1">
              Actividades Propuestas
            </label>
            <textarea
              {...register('actividades')}
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all resize-y input-uppercase"
              placeholder="Describa las actividades..."
            />
            {errors.actividades && (
              <p className="text-red-500 text-xs mt-1">{errors.actividades.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-teal uppercase tracking-wider mb-1">
              Evidencia Fotográfica
            </label>
            {!photoPreview ? (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-teal/40 rounded-xl cursor-pointer hover:bg-teal-50 transition-all">
                <Camera className="text-teal mb-2" size={32} />
                <p className="text-sm font-semibold text-teal">
                  Haz clic para agregar foto
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG — se comprime automáticamente
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Evidencia"
                  className="max-h-48 rounded-xl border-2 border-teal/20"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 active:scale-90 transition-all duration-150 ease-out"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-teal uppercase tracking-wider mb-1">
              Observaciones
            </label>
            <textarea
              {...register('observaciones')}
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all resize-y input-uppercase"
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-guinda text-white py-4 rounded-xl font-bold text-lg hover:bg-guinda-light active:scale-[0.98] transition-all duration-150 ease-out shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={22} />
              Guardando...
            </>
          ) : (
            <>
              <Save size={22} />
              Guardar y Descargar PDF
            </>
          )}
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={async () => {
            await handleSubmit(
              async (data) => {
                setIsLoading(true);
                try {
                  const record: ComiteRecord = {
                    ...data,
                    folio: 'BORRADOR',
                    fechaRegistro: new Date().toISOString(),
                    id: 'preview',
                  };
                  await previewActaPDF(record);
                } finally {
                  setIsLoading(false);
                }
              },
              () => {
                alert('Complete los campos requeridos para vista previa');
              }
            )();
          }}
          className="flex items-center justify-center gap-2 bg-white border-2 border-teal text-teal py-4 px-6 rounded-xl font-bold hover:bg-teal-50 active:scale-[0.98] transition-all duration-150 ease-out disabled:opacity-50"
        >
          <FileDown size={22} />
          Vista Previa PDF
        </button>
      </div>
    </form>
  );
}
