package eu.excitementproject.eop.common.utilities;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.Test;

import eu.excitementproject.eop.common.utilities.SVMPerfNative;
import eu.excitementproject.eop.common.utilities.file.FileUtils;



/**
 * @author Erel Segal
 * @since 27/09/2011
 */
public class SVMPerfNativeUtils extends SVMPerfNative {
	
	//private SVMPerfNativeUtils() { /* static class - do not instantiate */ }

	/**
	 * Constants for {@link #svmPerfLearnUsingTempFiles}
	 */
	final protected static String TEMP_FILE_PREFIX="svmperf";
	final protected static String TRAIN_FILE_SUFFIX=".train";
	final protected static String MODEL_FILE_SUFFIX=".model";
	
	/**
	 * Constants for {@link #weightMap(String)}
	 */
	final protected static Pattern SVM_PERF_MODEL_PATTERN = Pattern.compile(
			"(?s)"+  // single string option (. matches newline)
			"(?m)"+  // multiline option (^ matches at start of line)
			".*"+    // skip the beginning of string
			"^(.*) # threshold b.*"+  // parse the threshold line
			"^(.*) #.*"  // parse the weights line
			);
	
	/**
     * Emergency function, to use if the string-based svmPerfLearn breaks with a memory error.
     * Puts the given string in a temporary file, then uses the file-based svmPerfLearn, then converts the resulting file to a model string.
     */
	public synchronized static String svmPerfLearnUsingTempFiles(final String args, String examples) throws IOException {
		final File trainfile = File.createTempFile(TEMP_FILE_PREFIX, TRAIN_FILE_SUFFIX);
		final File modelfile = File.createTempFile(TEMP_FILE_PREFIX, MODEL_FILE_SUFFIX);
		try {
			FileUtils.writeFile(trainfile, examples);
		} catch (IOException ex) {
			System.err.println("Cannot write train file of size "+examples.length()+" ("+examples.substring(0,1000)+"... )");
			throw ex;
		}
		Thread learnThread = new Thread() { // surround in a thread, to prevent "exit" from crashing the entire Java program.
			@Override public void run() {
				svmPerfLearn(args+" "+trainfile.getAbsolutePath()+" "+modelfile.getAbsolutePath());
			}
		};
		learnThread.start();
		try {
			learnThread.join(60000 /* wait at most 1 minute for train completion */);
			String model = FileUtils.loadFileToString(modelfile).replace("\r\n", "\n");
			trainfile.deleteOnExit();
			modelfile.deleteOnExit();
			return model;
		} catch (InterruptedException ex) {
			throw new IOException("Could not complete svm_perf_learn: "+ex, ex);
		}
	}
	
	
	//run SVMPerfLearn and take the model file and create a string representation of the model

	/**
	 * Extract the weights from the given svmperf model. 
	 * @param model a model in svmperf format (returned from #svmPerfLearn).
	 * @return a map from a feature index  to its weight. Feature 0 is mapped to the threshold.
	 */
	public static Map<Integer, Double> weightMap(String model) {
		Matcher matcher;
		if ((matcher=SVM_PERF_MODEL_PATTERN.matcher(model)).matches()) {
			double threshold = Double.valueOf(matcher.group(1));
			String[] featuresAndWeights = matcher.group(2).split(" ");
			
			Map<Integer, Double> map = new HashMap<Integer, Double>();
			map.put(0, threshold);
			//String alphaTimesY = featuresAndWeights[0]; // always 1 in svmperf
			for (int i=1; i<featuresAndWeights.length; ++i) {
				String featureAndWeight = featuresAndWeights[i];
				String[] featureWeight = featureAndWeight.split(":");
				if (featureWeight.length!=2) {
					throw new IllegalArgumentException("Model featureAndWeight doesn't match svm-perf pattern: featureAndWeight="+featureAndWeight);
				}
				int feature = Integer.valueOf(featureWeight[0]);
				if (feature<=0) {
					throw new IllegalArgumentException("Non-positive feature id: featureAndWeight="+featureAndWeight);
				}
				double weight = Double.valueOf(featureWeight[1]);
				map.put(feature, weight);
			}
			return map;
		} else {
			throw new IllegalArgumentException("Model doesn't match svm-perf pattern: "+model);
		}
	}
	

	

	/**
	 * Classify a sample given as a feature-value map, using a feature-value model.
	 * @param inputMap maps integer features to double values.
	 * @param modelMap maps integer features to double weights; returned from {@link SVMPerfNativeUtils#weightMap}.
	 * @note feature ids start from 1; feature 0 is the threshold value.
	 * @return the classification value (>0 = positive, <0 = negative).
	 */
	public static double svmPerfClassifyUsingMap(Map<Integer, Double> inputMap, Map<Integer, Double> modelMap) {
		if (!modelMap.containsKey(0))
			throw new IllegalArgumentException("Model doesn't contain the thershold value! "+modelMap);
		if (inputMap.containsKey(0))
			throw new IllegalArgumentException("Input contains feature #0! "+inputMap);
		
		double result = -modelMap.get(0); // -b (threshold)
		for (Entry<Integer, Double> entry: inputMap.entrySet()) {
			Integer featureId = entry.getKey();
			if (modelMap.containsKey(featureId))
				result += modelMap.get(featureId)*entry.getValue();
		}

		return result;
	}

	/**
	 * Classify a sample given as a feature-value map, using a feature-value model.
	 * @param inputMap maps integer features (starting at 1) to numeric values.
	 * @param modelMap maps integer features to double weights; returned from {@link SVMPerfNativeUtils#weightMap}.
	 * @note feature ids start from 1; feature 0 is the threshold value.
	 * @return the classification value (>0 = positive, <0 = negative).
	 */
	public static double svmPerfClassifyUsingArray(Number[] inputMap, Map<Integer, Double> modelMap) {
		if (!modelMap.containsKey(0))
			throw new IllegalArgumentException("Model doesn't contain the thershold value! "+modelMap);
		double result = -modelMap.get(0); // -b (threshold)
		for (int featureId=1; featureId<inputMap.length; ++featureId) {
			if (modelMap.containsKey(featureId))
				result += modelMap.get(featureId)* inputMap[featureId].doubleValue();
		}
		return result;
	}

	/**
	 * Classify a sample given as a feature-value map, using a feature-value model.
	 * @param inputMap maps integer features (starting at 1) to numeric values.
	 * @param modelMap maps integer features to double weights; returned from {@link SVMPerfNativeUtils#weightMap}.
	 * @note feature ids start from 1; feature 0 is the threshold value.
	 * @return the classification value (>0 = positive, <0 = negative).
	 */
	public static double svmPerfClassifyUsingArray(int[] inputMap, Map<Integer, Double> modelMap) {
		if (modelMap==null)
			throw new IllegalArgumentException("Null model map!");
		if (!modelMap.containsKey(0))
			throw new IllegalArgumentException("Model doesn't contain the thershold value! "+modelMap);
		double result = -modelMap.get(0); // -b (threshold)
		for (int featureId=1; featureId<inputMap.length; ++featureId) {
			if (modelMap.containsKey(featureId))
				result += modelMap.get(featureId)* inputMap[featureId];
		}
		return result;
	}

	/**
	 * Classify a sample given as a feature-value map, using a feature-value model.
	 * @param inputMap maps integer features (starting at 1) to numeric values.
	 * @param modelMap maps integer features to double weights; returned from {@link SVMPerfNativeUtils#weightMap}.
	 * @note feature ids start from 1; feature 0 is the threshold value.
	 * @return the classification value (>0 = positive, <0 = negative).
	 */
	public static double svmPerfClassifyUsingArray(float[] inputMap, Map<Integer, Double> modelMap) {
		if (modelMap==null)
			throw new IllegalArgumentException("Null model map!");
		if (!modelMap.containsKey(0))
			throw new IllegalArgumentException("Model doesn't contain the thershold value! "+modelMap);
		double result = -modelMap.get(0); // -b (threshold)
		for (int featureId=1; featureId<inputMap.length; ++featureId) {
			if (modelMap.containsKey(featureId))
				result += modelMap.get(featureId)* inputMap[featureId];
		}
		return result;
	}

	
	
	/*
	 * TEST ZONE
	 */

	@Test public void test() throws IOException {
		// test svmPerfLearnUsingTempFiles:
		String train_examples = 
			"+1 10:1 20:2\n"+
			"-1 10:1 30:1\n";
		String model1 = svmPerfLearn("-c 0.01 -v 0", train_examples);
		String model2 = svmPerfLearnUsingTempFiles("-c 0.01 -v 0", train_examples);
		if (!model1.replaceAll("[\r\n]", "").equals(model2.replaceAll("[\r\n]", ""))) {
			System.err.println("The models are not equal:\n\n"+model1+"\n\n"+model2);
			System.exit(1);
		}
		System.out.println("The model is: "+model1);
		
		// test weightMap:
		Map<Integer, Double> modelMap;
		modelMap = weightMap(model1); // The weight map is: {0=0.21428571, 20=0.5714286, 10=-0.21428572, 30=-0.5}
		System.out.println("The weight map is: "+modelMap);
		
		// test classify:
		String stringSample = "10:1 20:1 30:1 40:1";
		Map<Integer, Double> inputMap = new HashMap<Integer,Double>();
		inputMap.put(10, 1.0);
		inputMap.put(20, 1.0);
		inputMap.put(30, 1.0);
		inputMap.put(40, 1.0);
		Double[] inputArray = new Double[41];
		inputArray[10]=inputArray[20]=inputArray[30]=inputArray[40]=1.0;

		double classify1 = Double.valueOf(svmPerfClassify("-v 0", "0 "+stringSample, model1));
		double classify2 = svmPerfClassifyUsingMap(inputMap, modelMap);
		double classify3 = svmPerfClassifyUsingArray(inputArray, modelMap);
		if (classify1 != classify2 || classify2 != classify3) {
			System.err.println("The classifications are not equal:\n\n"+classify1+"\n\n"+classify2+"\n\n"+classify3);
			System.exit(1);
		}
		System.out.println("The classification of "+stringSample+" is: "+classify1);
		
		// test classify performance:
		long start1 = System.currentTimeMillis();
		for (int i=1; i<=1000; ++i)
			classify1 = Double.valueOf(svmPerfClassify("-v 0", "0 "+stringSample, model1));
		long duration1 = System.currentTimeMillis()-start1;
		long start2 = System.currentTimeMillis();
		for (int i=1; i<=1000; ++i)
			classify2 = svmPerfClassifyUsingMap(inputMap, modelMap);
		long duration2 = System.currentTimeMillis()-start2;
		long start3 = System.currentTimeMillis();
		for (int i=1; i<=1000; ++i)
			classify3 = svmPerfClassifyUsingArray(inputArray, modelMap);
		long duration3 = System.currentTimeMillis()-start3;
		System.out.println("Classification with the library took "+duration1+" microseconds");
		System.out.println("Classification with a map took "+duration2+" microseconds");
		System.out.println("Classification with an array took "+duration3+" microseconds");

		System.out.println("All tests OK!");
	}



	/**
	 * demo program
	 * @throws IOException 
	 */
	public static void main(String[] args) throws IOException {
		new SVMPerfNativeUtils().test();
	}
	
}
