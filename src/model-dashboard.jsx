import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Package, ExternalLink, X } from 'lucide-react';
import { Alert, AlertDescription } from './components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';

export default function ModelDashboard() {
  const [models, setModels] = useState([]);
  const [pendingModels, setPendingModels] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [tokenizerFile, setTokenizerFile] = useState(null);
  const [dragActive, setDragActive] = useState({ model: false, tokenizer: false });
  
  // New state for aggregation
  const [selectedForAggregation, setSelectedForAggregation] = useState([]);
  const [aggregationStatus, setAggregationStatus] = useState(null);
  const [baseModel, setBaseModel] = useState(null);
  const [baseModelInput, setBaseModelInput] = useState('');
  const [showBaseModelSuggestions, setShowBaseModelSuggestions] = useState(false);
  const [modelsToAggregate, setModelsToAggregate] = useState([]);
  const [aggregateModelInput, setAggregateModelInput] = useState('');
  const [showAggregateSuggestions, setShowAggregateSuggestions] = useState(false);
  const [aggregationName, setAggregationName] = useState('');


  useEffect(() => {
    fetchApprovedModels();
    fetchPendingModels();
  }, []);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchApprovedModels = async () => {
    try {
      const response = await fetch(`${API_URL}/approved-models`);
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchPendingModels = async () => {
    try {
      const response = await fetch(`${API_URL}/pending-models`);
      const data = await response.json();
      setPendingModels(data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const handleDrag = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  }, []);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        if (type === 'model') {
          setModelFile(file);
        } else {
          setTokenizerFile(file);
        }
      } else {
        setUploadStatus({ type: 'error', message: 'Please upload ZIP files only' });
      }
    }
  }, []);

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'model') {
        setModelFile(file);
      } else {
        setTokenizerFile(file);
      }
    }
  };

  const removeFile = (type) => {
    if (type === 'model') {
      setModelFile(null);
    } else {
      setTokenizerFile(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    
    // Get form values
    const modelName = event.target.model_name.value;
    const task = event.target.task.value;

    if (!modelFile || !tokenizerFile) {
      setUploadStatus({ type: 'error', message: 'Please upload both model and tokenizer files' });
      return;
    }

    formData.append('model_name', modelName);
    formData.append('task', task);
    formData.append('model.zip', modelFile);
    formData.append('tokenizer.zip', tokenizerFile);
    
    try {
      setUploadStatus({ type: 'info', message: 'Uploading model...' });
      const response = await fetch(`${API_URL}/add_model`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUploadStatus({ type: 'success', message: 'Model uploaded successfully! Voting in progress.' });
        setModelFile(null);
        setTokenizerFile(null);
        fetchApprovedModels();
      } else {
        setUploadStatus({ type: 'error', message: data.error || 'Upload failed' });
      }
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Error uploading model' });
    }
  };

  const handleModelClick = (model) => {
    setSelectedModel(model === selectedModel ? null : model);
  };

  const fetchModel = async (nft_id) => {
    try {
      window.location.href = `${API_URL}/fetch_model?nft_id=${nft_id}`;
    } catch (error) {
      console.error('Error fetching model:', error);
    }
  };

  // New function to handle opening voting channel
  const openVotingChannel = () => {
    window.open('https://app.element.io/#/room/#!roomA:socialxmatch.com', '_blank');
  };

  // New function to toggle model selection for aggregation
  const toggleModelForAggregation = (model) => {
    if (selectedForAggregation.some(m => m.model_name === model.model_name)) {
      setSelectedForAggregation(selectedForAggregation.filter(m => m.model_name !== model.model_name));
    } else {
      setSelectedForAggregation([...selectedForAggregation, model]);
    }
  };

  // New function to handle model aggregation
  const handleAggregateModels = async () => {
    if (!baseModel || modelsToAggregate.length === 0) {
      setAggregationStatus({ type: 'error', message: 'Please select a base model and models to aggregate' });
      return;
    }
  
    if (!aggregationName.trim()) {
      setAggregationStatus({ type: 'error', message: 'Please provide a name for the aggregated model' });
      return;
    }
  
    try {
      // Start aggregation and show "in progress" immediately
  setAggregationStatus({ type: 'info', message: 'Aggregation in progress...' });

  // Make the request without awaiting its completion
  fetch(`${API_URL}/aggregate_models`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_name: aggregationName,
      base_model: baseModel.model_name,
      models_to_aggregate: modelsToAggregate.map(model => model.model_name),
    }),
  });


  // Reset form fields immediately
  setBaseModel(null);
  setBaseModelInput('');
  setModelsToAggregate([]);
  setAggregationName('');

  // Optionally, you can refresh models list after a delay
  setTimeout(() => {
    fetchApprovedModels();
  }, 15000); // 15 seconds delay  
     
    } catch (error) {
      setAggregationStatus({ type: 'error', message: 'Error during aggregation process' });
      console.error('Aggregation error:', error);
    }
  };
  
  const FileUploadZone = ({ type, file, dragActive: isDragActive }) => (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 transition-all flex-wrap
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${file ? 'bg-green-50' : 'hover:bg-gray-50'}`}
      onDragEnter={(e) => handleDrag(e, type)}
      onDragLeave={(e) => handleDrag(e, type)}
      onDragOver={(e) => handleDrag(e, type)}
      onDrop={(e) => handleDrop(e, type)}
    >
      <input
        type="file"
        onChange={(e) => handleFileSelect(e, type)}
        accept=".zip"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="text-center">
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="text-green-500" size={24} />
            <span className="text-green-600">{file.name}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                removeFile(type);
              }}
              className="ml-2 p-1 rounded-full hover:bg-red-100"
            >
              <X size={16} className="text-red-500" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto text-gray-400" size={24} />
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop your {type} ZIP file here, or click to select
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Only ZIP files are accepted
            </p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div 
      style={{display:'flex', width:'100vw', justifyContent:'space-between'}}
    >
      <div style={{ minWidth:'35%', marginLeft:'20px'}}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Upload New Model</CardTitle>
            <CardDescription>Upload a new model for voting and approval</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Model Name</label>
                  <input
                    type="text"
                    name="model_name"
                    required
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Task</label>
                  <input
                    type="text"
                    name="task"
                    required
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Model Files (ZIP)</label>
                  <FileUploadZone
                    type="model"
                    file={modelFile}
                    dragActive={dragActive.model}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tokenizer Files (ZIP)</label>
                  <FileUploadZone
                    type="tokenizer"
                    file={tokenizerFile}
                    dragActive={dragActive.tokenizer}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 
                        transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                Upload Model
              </button>
            </form>
            
            {uploadStatus && (
              <Alert className={`mt-4 ${
                uploadStatus.type === 'error' ? 'bg-red-50' : 
                uploadStatus.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
              }`}>
                <AlertDescription>{uploadStatus.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* New Voting Channel Button */}
        <button
          onClick={openVotingChannel}
          className="w-full bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 
                   transition-colors flex items-center justify-center gap-2 mt-4"
        >
          <ExternalLink size={20} />
          Open Voting Channel
        </button>


        {/* Aggregation Section */}
<Card className="mt-4">
  <CardHeader>
    <CardTitle className="text-xl font-bold">Aggregate Models</CardTitle>
    <CardDescription>Combine multiple models into one</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Aggregated Model Name</label>
        <input
          type="text"
          value={aggregationName}
          onChange={(e) => setAggregationName(e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter a name for the aggregated model"
        />
      </div>
      
      {/* Base Model Selector with Autocomplete */}
      <div>
        <label className="block text-sm font-medium mb-2">Base Model</label>
        <div >
          <input
            type="text"
            value={baseModelInput}
            onChange={(e) => {
              setBaseModelInput(e.target.value);
              setShowBaseModelSuggestions(true);
            }}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type to search for base model"
          />
          
          {/* Base Model Suggestions */}
          {showBaseModelSuggestions && baseModelInput && (
            <div style={{backgroundColor:'white', zIndex:9999, width:'32.5%'}} className="absolute bottom-0 z-20 mt-1 bg-white border rounded-lg min-h-30 shadow-lg max-h-60 overflow-y-auto">
              {models
                .filter(model => 
                  model.model_name.toLowerCase().includes(baseModelInput.toLowerCase()) &&
                  !modelsToAggregate.includes(model)
                )
                .map(model => (
                  <div
                    key={model.model_id}
                    className="p-2 hover:bg-blue-50 cursor-pointer"
                    onClick={() => {
                      setBaseModel(model);
                      setBaseModelInput(model.model_name);
                      setShowBaseModelSuggestions(false);
                    }}
                  >
                    {model.model_name}
                  </div>
                ))}
            </div>
          )}
        </div>
        
        {baseModel && (
          <div className="mt-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg flex justify-between items-center">
            <span>{baseModel.model_name}</span>
            <button 
              onClick={() => {
                setBaseModel(null);
                setBaseModelInput('');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* Models to Aggregate Multi-Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Models to Aggregate</label>
        <div >
          <input
            type="text"
            value={aggregateModelInput}
            onChange={(e) => {
              setAggregateModelInput(e.target.value);
              setShowAggregateSuggestions(true);
            }}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type to search for models to aggregate"
          />
          
          {/* Aggregate Models Suggestions */}
          {showAggregateSuggestions && aggregateModelInput && (
            <div style={{backgroundColor:'white', zIndex:9999, width:'32.5%'}} className="absolute bottom-0 z-20 mt-1 bg-white border rounded-lg min-h-30 shadow-lg max-h-60 overflow-y-auto">
              {models
                .filter(model => 
                  model.model_name.toLowerCase().includes(aggregateModelInput.toLowerCase()) &&
                  (!baseModel || model.model_id !== baseModel.model_id) &&
                  !modelsToAggregate.some(m => m.model_id === model.model_id)
                )
                .map(model => (
                  <div
                    key={model.model_id}
                    className="p-2 hover:bg-blue-50 cursor-pointer"
                    onClick={() => {
                      setModelsToAggregate([...modelsToAggregate, model]);
                      setAggregateModelInput('');
                      setShowAggregateSuggestions(false);
                    }}
                  >
                    {model.model_name}
                  </div>
                ))}
            </div>
          )}
        </div>
        
        {/* Selected Models Display */}
        <div className="block text-sm font-medium mb-2">
          {modelsToAggregate.map(model => (
            <div key={model.model_id} className="mt-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg flex justify-between items-center">
              {model.model_name}
              <button 
                onClick={() => setModelsToAggregate(modelsToAggregate.filter(m => m.model_id !== model.model_id))}
                className="text-blue-600 hover:text-blue-800"
              >
                <X size={16} />
              </button>
              
            </div>
          ))}
          {modelsToAggregate.length === 0 && (
            <p className="text-sm text-gray-500">Select models to aggregate (different from base model)</p>
          )}
        </div>
      </div>
      
      <button
        onClick={handleAggregateModels}
        disabled={!baseModel || modelsToAggregate.length === 0 || !aggregationName.trim()}
        className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2
          ${!baseModel || modelsToAggregate.length === 0 || !aggregationName.trim() 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-orange-500 text-white hover:bg-orange-600'}`}
      >
        Aggregate Models
      </button>
      
      {aggregationStatus && (
        <Alert className={`mt-2 ${
          aggregationStatus.type === 'error' ? 'bg-red-50' : 
          aggregationStatus.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
        }`}>
          <AlertDescription>{aggregationStatus.message}</AlertDescription>
        </Alert>
      )}
    </div>
  </CardContent>
</Card>

      </div>

      <div style={{display:'flex', flexDirection:'column', gap : '20px',  minWidth:'60%'}}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Approved Models</CardTitle>
            <CardDescription>View and download approved models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {models.map((model) => (
                <Card key={model.model_id} 
                      className={`cursor-pointer transition-all ${selectedModel === model ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => handleModelClick(model)}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{model.model_name}</CardTitle>
                      <CardDescription>Created: {new Date(model.created_at).toLocaleDateString()}</CardDescription>
                    </div>
                    <FileText className="text-gray-400" />
                  </CardHeader>
                  
                  {selectedModel === model && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Model ID</p>
                          <p className="text-gray-600">{model.model_id}</p>
                        </div>
                        <div>
                          <p className="font-medium">BLOCK ID</p>
                          <p style={{textWrap: 'pretty', wordWrap:'break-word'}} className="text-gray-600 text-wrap text-center">{model.nft_id}</p>
                        </div>
                        <div>
                          <p className="font-medium">Status</p>
                          <p className="text-gray-600">{model.status}</p>
                        </div>
                      </div>
                      
                      <div className="space-x-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchModel(model.nft_id);
                          }}
                          className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 inline-flex"
                        >
                          <Package size={16} /> Download Model
                        </button>
                        
                        <a
                          href={`https://explorer.iota.org/iota-testnet/block/${model.nft_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-purple-500 text-white px-4 py-2 rounded flex items-center gap-2 inline-flex"
                        >
                          <ExternalLink size={16} /> View NFT
                        </a>

                    {/* New button for selecting models for aggregation */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModelForAggregation(model);
                      }}
                      className={`${
                        selectedForAggregation.some(m => m.model_id === model.model_id)
                          ? 'bg-orange-500'
                          : 'bg-blue-500'
                      } text-white px-4 py-2 rounded flex items-center gap-2 inline-flex`}
                    >
                      {selectedForAggregation.some(m => m.model_id === model.model_id)
                        ? 'Selected for Aggregation'
                        : 'Select for Aggregation'}
                    </button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </CardContent>
        </Card>

        <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Pending Model Approval</CardTitle>
        <CardDescription>View models currently in voting stage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingModels.map((model) => (
            <Card key={model.model_id} 
                  className={`cursor-pointer transition-all ${selectedModel === model ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => handleModelClick(model)}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{model.model_name}</CardTitle>
                  <CardDescription>Created: {new Date(model.created_at).toLocaleDateString()}</CardDescription>
                </div>
                <FileText className="text-gray-400" />
              </CardHeader>
              
              {selectedModel === model && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Model ID</p>
                      <p className="text-gray-600">{model.model_id}</p>
                    </div>
                    <div>
                      <p className="font-medium">BLOCK ID</p>
                      <p className="text-gray-600 text-wrap text-center">{model.nft_id}</p>
                    </div>
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-gray-600">{model.status}</p>
                    </div>
                  </div>

                  <div className="space-x-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchModel(model.nft_id);
                      }}
                      className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 inline-flex"
                    >
                      <Package size={16} /> Download Model
                    </button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </CardContent>
        </Card>
      </div>
    </div>
  );
}