/* ----------------------------------------------------------------------------
 * This file was automatically generated by SWIG (http://www.swig.org).
 * Version 4.0.0
 *
 * Do not make changes to this file unless you know what you are doing--modify
 * the SWIG interface file instead.
 * ----------------------------------------------------------------------------- */

package io.adaptivecards.objectmodel;

public class ToggleVisibilityActionParser extends ActionElementParser {
  private transient long swigCPtr;
  private transient boolean swigCMemOwnDerived;

  protected ToggleVisibilityActionParser(long cPtr, boolean cMemoryOwn) {
    super(AdaptiveCardObjectModelJNI.ToggleVisibilityActionParser_SWIGSmartPtrUpcast(cPtr), true);
    swigCMemOwnDerived = cMemoryOwn;
    swigCPtr = cPtr;
  }

  protected static long getCPtr(ToggleVisibilityActionParser obj) {
    return (obj == null) ? 0 : obj.swigCPtr;
  }

  protected void swigSetCMemOwn(boolean own) {
    swigCMemOwnDerived = own;
    super.swigSetCMemOwn(own);
  }

  @SuppressWarnings("deprecation")
  protected void finalize() {
    delete();
  }

  public synchronized void delete() {
    if (swigCPtr != 0) {
      if (swigCMemOwnDerived) {
        swigCMemOwnDerived = false;
        AdaptiveCardObjectModelJNI.delete_ToggleVisibilityActionParser(swigCPtr);
      }
      swigCPtr = 0;
    }
    super.delete();
  }

  public ToggleVisibilityActionParser() {
    this(AdaptiveCardObjectModelJNI.new_ToggleVisibilityActionParser__SWIG_0(), true);
  }

  public ToggleVisibilityActionParser(ToggleVisibilityActionParser arg0) {
    this(AdaptiveCardObjectModelJNI.new_ToggleVisibilityActionParser__SWIG_1(ToggleVisibilityActionParser.getCPtr(arg0), arg0), true);
  }

  public BaseActionElement Deserialize(ParseContext context, JsonValue value) {
    long cPtr = AdaptiveCardObjectModelJNI.ToggleVisibilityActionParser_Deserialize(swigCPtr, this, ParseContext.getCPtr(context), context, JsonValue.getCPtr(value), value);
    return (cPtr == 0) ? null : new BaseActionElement(cPtr, true);
  }

  public BaseActionElement DeserializeFromString(ParseContext context, String jsonString) {
    long cPtr = AdaptiveCardObjectModelJNI.ToggleVisibilityActionParser_DeserializeFromString(swigCPtr, this, ParseContext.getCPtr(context), context, jsonString);
    return (cPtr == 0) ? null : new BaseActionElement(cPtr, true);
  }

}
